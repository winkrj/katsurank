package com.katsurank.ranking.service;

import com.katsurank.ranking.dto.MapPinResponse;
import com.katsurank.ranking.dto.RankingItem;
import com.katsurank.ranking.dto.RankingRow;
import com.katsurank.ranking.dto.TopRankingResult;
import com.katsurank.ranking.exception.LimitExceededException;
import com.katsurank.ranking.repository.RankingQueryRepository;
import com.katsurank.common.web.PageResponse;
import org.springframework.stereotype.Service;
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
        List<RankingItem> items = new ArrayList<>(content.size());
        Map<Integer, Long> rankByVoteCount = new HashMap<>();
        for (RankingRow restaurant : content) {
            long rank = rankByVoteCount.computeIfAbsent(restaurant.voteCount(),
                    voteCount -> rankingQueryRepository.countWithVoteCountGreaterThan(voteCount) + 1);
            items.add(restaurant.toItem((int) rank));
        }

        return new PageResponse<>(items, rankingQueryRepository.countActiveRestaurants(), offset, limit);
    }

    @Transactional(readOnly = true)
    public TopRankingResult getTop() {
        return rankingQueryRepository.findTop()
                .<TopRankingResult>map(restaurant -> new TopRankingResult.Found(restaurant.toItem(1)))
                .orElseGet(TopRankingResult.Empty::new);
    }

    @Transactional(readOnly = true)
    public List<MapPinResponse> getMapPins() {
        return rankingQueryRepository.findActivePinsWithCoordinates();
    }
}
