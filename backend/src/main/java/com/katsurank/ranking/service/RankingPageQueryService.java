package com.katsurank.ranking.service;

import com.katsurank.common.web.PageResponse;
import com.katsurank.ranking.dto.RankingItem;
import com.katsurank.ranking.dto.RankingRow;
import com.katsurank.ranking.repository.RankingQueryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/** 랭킹 페이지의 DB 조회와 읽기 전용 트랜잭션 경계를 담당한다. */
@Service
public class RankingPageQueryService {

    private final RankingQueryRepository rankingQueryRepository;

    public RankingPageQueryService(RankingQueryRepository rankingQueryRepository) {
        this.rankingQueryRepository = rankingQueryRepository;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public PageResponse<RankingItem> load(int offset, int limit) {
        List<RankingRow> content = rankingQueryRepository.findActiveRanking(offset, limit);
        return new PageResponse<>(toRankingItems(content, offset),
                rankingQueryRepository.countActiveRestaurants(), offset, limit);
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
