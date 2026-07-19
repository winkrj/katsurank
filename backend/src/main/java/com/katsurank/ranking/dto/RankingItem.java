package com.katsurank.ranking.dto;

import java.math.BigDecimal;

public record RankingItem(
        int rank,
        Long id,
        String name,
        String address,
        BigDecimal latitude,
        BigDecimal longitude,
        int voteCount,
        String placeUrl) {
}
