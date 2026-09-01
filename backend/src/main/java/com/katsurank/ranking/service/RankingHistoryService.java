package com.katsurank.ranking.service;

import com.katsurank.ranking.dto.RankingHistoryItem;
import com.katsurank.ranking.exception.RankingRestaurantNotFoundException;
import com.katsurank.ranking.repository.RankingHistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class RankingHistoryService {

    static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");

    private final RankingHistoryRepository rankingHistoryRepository;
    private final Clock clock;

    public RankingHistoryService(RankingHistoryRepository rankingHistoryRepository,
                                 Clock clock) {
        this.rankingHistoryRepository = rankingHistoryRepository;
        this.clock = clock;
    }

    @Transactional
    public int captureDailySnapshot() {
        Instant capturedAt = Instant.now(clock);
        LocalDate snapshotDate = capturedAt.atZone(SEOUL_ZONE).toLocalDate();
        return rankingHistoryRepository.captureDailySnapshot(snapshotDate, capturedAt);
    }

    @Transactional(readOnly = true)
    public List<RankingHistoryItem> getHistory(Long restaurantId) {
        if (!rankingHistoryRepository.restaurantExists(restaurantId)) {
            throw new RankingRestaurantNotFoundException(restaurantId);
        }

        List<RankingHistoryItem> items = new ArrayList<>(
                rankingHistoryRepository.findTop7ByIdRestaurantIdOrderByIdSnapshotDateDesc(restaurantId)
                        .stream()
                        .map(RankingHistoryItem::from)
                        .toList());
        Collections.reverse(items);
        return List.copyOf(items);
    }
}
