package com.katsurank.ranking.dto;

import com.katsurank.ranking.RankingDailySnapshot;

import java.time.LocalDate;

public record RankingHistoryItem(
        LocalDate date,
        int rank,
        int voteCount) {

    public static RankingHistoryItem from(RankingDailySnapshot snapshot) {
        return new RankingHistoryItem(
                snapshot.getId().getSnapshotDate(),
                snapshot.getRank(),
                snapshot.getVoteCount());
    }
}
