package com.katsurank.ranking.service;

import com.katsurank.ranking.dto.MapPinResponse;
import com.katsurank.ranking.dto.MapPinRow;
import com.katsurank.ranking.dto.RankingItem;
import com.katsurank.ranking.dto.RankingSnapshotEvent;
import com.katsurank.ranking.dto.TopRankingResult;
import com.katsurank.ranking.dto.VoteCountGroup;
import com.katsurank.ranking.exception.LimitExceededException;
import com.katsurank.ranking.repository.RankingQueryRepository;
import com.katsurank.common.web.PageResponse;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Clock;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class RankingService {

    private static final Logger log = LoggerFactory.getLogger(RankingService.class);

    private static final int MAX_LIMIT = 100;
    private static final int CACHED_LIMIT = 20;

    private final RankingQueryRepository rankingQueryRepository;
    private final RankingPageQueryService rankingPageQueryService;
    private final MeterRegistry meterRegistry;
    private final RankingSseService rankingSseService;
    private final RankingChangeTracker rankingChangeTracker;
    private final Clock clock;
    private final boolean cacheEnabled;
    private final AtomicReference<RankingSnapshot> cachedTopRanking = new AtomicReference<>();
    private final AtomicBoolean lastRefreshFailed = new AtomicBoolean();
    private final AtomicLong lastRefreshStartedNanos = new AtomicLong();
    private final AtomicLong snapshotVersion = new AtomicLong();
    private final Counter cacheHits;
    private final Counter refreshFailures;
    private final Timer refreshDuration;
    private final Timer refreshInterval;

    public RankingService(RankingQueryRepository rankingQueryRepository,
                          RankingPageQueryService rankingPageQueryService,
                          MeterRegistry meterRegistry,
                          RankingSseService rankingSseService,
                          RankingChangeTracker rankingChangeTracker,
                          Clock clock,
                          @Value("${ranking.cache.enabled:true}") boolean cacheEnabled) {
        this.rankingQueryRepository = rankingQueryRepository;
        this.rankingPageQueryService = rankingPageQueryService;
        this.meterRegistry = meterRegistry;
        this.rankingSseService = rankingSseService;
        this.rankingChangeTracker = rankingChangeTracker;
        this.clock = clock;
        this.cacheEnabled = cacheEnabled;
        this.cacheHits = Counter.builder("ranking.cache.hits").register(meterRegistry);
        this.refreshFailures = Counter.builder("ranking.cache.refresh.failures").register(meterRegistry);
        this.refreshDuration = Timer.builder("ranking.cache.refresh.duration").register(meterRegistry);
        this.refreshInterval = Timer.builder("ranking.cache.refresh.interval").register(meterRegistry);
    }

    public PageResponse<RankingItem> getRanking(int offset, int limit) {
        if (offset < 0) {
            throw new IllegalArgumentException("offset은 0 이상이어야 합니다.");
        }
        if (limit < 1 || limit > MAX_LIMIT) {
            throw new LimitExceededException();
        }

        if (cacheEnabled && offset == 0 && limit <= CACHED_LIMIT) {
            RankingSnapshot snapshot = cachedTopRanking.get();
            if (snapshot != null) {
                cacheHits.increment();
                return snapshot.page(limit);
            }
            cacheMiss(lastRefreshFailed.get() ? "refresh_failure_fallback" : "cache_empty");
            return rankingPageQueryService.load(offset, limit);
        }

        if (cacheEnabled) {
            cacheMiss("range_outside");
        }
        return rankingPageQueryService.load(offset, limit);
    }

    /**
     * TOP 20 스냅샷을 주기적으로 갱신한다. 실패 시 마지막 정상 스냅샷은 유지한다.
     */
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public void refreshRankingCache() {
        if (!cacheEnabled) {
            return;
        }

        long startedNanos = System.nanoTime();
        long previousNanos = lastRefreshStartedNanos.getAndSet(startedNanos);
        if (previousNanos != 0) {
            refreshInterval.record(Duration.ofNanos(startedNanos - previousNanos));
        }

        try {
            RankingChangeTracker.ChangeMarker changeMarker = rankingChangeTracker.current();
            RankingSnapshot refreshed = refreshDuration.record(
                    () -> RankingSnapshot.from(rankingPageQueryService.load(0, CACHED_LIMIT)));
            RankingSnapshot previous = cachedTopRanking.getAndSet(refreshed);
            boolean recovered = lastRefreshFailed.getAndSet(false);
            if (recovered) {
                log.atInfo().log("랭킹 캐시 갱신 복구");
            }
            if (previous == null || changeMarker != null || !previous.items().equals(refreshed.items())) {
                Instant generatedAt = Instant.now(clock);
                Instant changedAt = changeMarker == null ? generatedAt : changeMarker.committedAt();
                rankingSseService.broadcast(new RankingSnapshotEvent(
                        snapshotVersion.incrementAndGet(), changedAt, generatedAt, refreshed.items()));
            }
            rankingChangeTracker.clear(changeMarker);
        } catch (RuntimeException exception) {
            refreshFailures.increment();
            if (lastRefreshFailed.compareAndSet(false, true)) {
                log.atWarn().setCause(exception).addKeyValue("limit", CACHED_LIMIT)
                        .log("랭킹 캐시 갱신 실패; 마지막 정상 스냅샷 유지");
            }
        }
    }

    private void cacheMiss(String reason) {
        Counter.builder("ranking.cache.misses")
                .tag("reason", reason)
                .register(meterRegistry)
                .increment();
    }

    /** total도 스냅샷 갱신 시점 값이며 보통 다음 refresh까지, 갱신 실패 시에는 그보다 오래 DB와 차이 날 수 있다. */
    private record RankingSnapshot(List<RankingItem> items, long total) {
        private static RankingSnapshot from(PageResponse<RankingItem> page) {
            return new RankingSnapshot(List.copyOf(page.items()), page.total());
        }

        private PageResponse<RankingItem> page(int limit) {
            return new PageResponse<>(items.subList(0, Math.min(limit, items.size())), total, 0, limit);
        }
    }

    @Transactional(readOnly = true)
    public TopRankingResult getTop() {
        return rankingQueryRepository.findTop()
                .<TopRankingResult>map(restaurant -> new TopRankingResult.Found(restaurant.toItem(1)))
                .orElseGet(TopRankingResult.Empty::new);
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public List<MapPinResponse> getMapPins() {
        Map<Integer, Integer> ranksByVoteCount = ranksByVoteCount();
        return rankingQueryRepository.findActivePinsWithCoordinates().stream()
                .map(pin -> toMapPinResponse(pin, ranksByVoteCount))
                .toList();
    }

    private Map<Integer, Integer> ranksByVoteCount() {
        List<VoteCountGroup> groups = rankingQueryRepository.findActiveVoteCountGroups();
        Map<Integer, Integer> ranks = new HashMap<>(groups.size());
        int rank = 1;
        for (VoteCountGroup group : groups) {
            ranks.put(group.voteCount(), rank);
            rank = Math.addExact(rank, Math.toIntExact(group.restaurantCount()));
        }
        return ranks;
    }

    private MapPinResponse toMapPinResponse(MapPinRow pin, Map<Integer, Integer> ranksByVoteCount) {
        Integer rank = ranksByVoteCount.get(pin.voteCount());
        if (rank == null) {
            throw new IllegalStateException("ACTIVE 지도 핀의 득표 수 순위를 찾을 수 없습니다. voteCount=" + pin.voteCount());
        }
        return new MapPinResponse(pin.id(), pin.name(), pin.latitude(), pin.longitude(), pin.voteCount(), rank);
    }

}
