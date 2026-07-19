package com.katsurank.ranking.dto;

/** 왕좌 조회의 유한한 도메인 결과. */
public sealed interface TopRankingResult permits TopRankingResult.Found, TopRankingResult.Empty {

    record Found(RankingItem item) implements TopRankingResult {
    }

    record Empty() implements TopRankingResult {
    }
}
