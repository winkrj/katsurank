package com.katsurank.ranking.dto;

import java.math.BigDecimal;

/** 랭킹 조회 전용 projection. Restaurant 엔티티를 랭킹 계층 밖으로 노출하지 않는다. */
public record RankingRow(
        Long id,
        String name,
        String address,
        BigDecimal latitude,
        BigDecimal longitude,
        int voteCount,
        String placeUrl) {

    public RankingItem toItem(int rank) {
        return new RankingItem(rank, id, name, address, latitude, longitude, voteCount, placeUrl);
    }
}
