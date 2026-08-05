package com.katsurank.ranking.service;

import com.katsurank.ranking.dto.MapPinResponse;
import com.katsurank.ranking.dto.MapPinRow;
import com.katsurank.ranking.dto.RankingItem;
import com.katsurank.ranking.dto.RankingRow;
import com.katsurank.ranking.dto.TopRankingResult;
import com.katsurank.ranking.dto.VoteCountGroup;
import com.katsurank.ranking.exception.LimitExceededException;
import com.katsurank.ranking.repository.RankingQueryRepository;
import com.katsurank.common.web.PageResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RankingService {

    private static final int MAX_LIMIT = 100;

    private final RankingQueryRepository rankingQueryRepository;

    public RankingService(RankingQueryRepository rankingQueryRepository) {
        this.rankingQueryRepository = rankingQueryRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<RankingItem> getRanking(int offset, int limit) {
        if (offset < 0) {
            throw new IllegalArgumentException("offset은 0 이상이어야 합니다.");
        }
        if (limit < 1 || limit > MAX_LIMIT) {
            throw new LimitExceededException();
        }

        List<RankingRow> content = rankingQueryRepository.findActiveRanking(offset, limit);
        return new PageResponse<>(toRankingItems(content, offset),
                rankingQueryRepository.countActiveRestaurants(), offset, limit);
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

    private List<RankingItem> toRankingItems(List<RankingRow> rows, int offset) {
        if (rows.isEmpty()) {
            return List.of();
        }

        int rank = (int) rankingQueryRepository.countWithVoteCountGreaterThan(rows.getFirst().voteCount()) + 1;
        int previousVoteCount = rows.getFirst().voteCount();
        List<RankingItem> items = new ArrayList<>(rows.size());
        for (int index = 0; index < rows.size(); index++) {
            RankingRow row = rows.get(index);
            if (index > 0 && row.voteCount() != previousVoteCount) {
                rank = offset + index + 1;
            }
            items.add(row.toItem(rank));
            previousVoteCount = row.voteCount();
        }
        return items;
    }
}
