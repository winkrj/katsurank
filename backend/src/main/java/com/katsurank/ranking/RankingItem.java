package com.katsurank.ranking;

import com.katsurank.restaurant.Restaurant;

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

    public static RankingItem of(Restaurant r, int rank) {
        return new RankingItem(
                rank,
                r.getId(),
                r.getName(),
                r.getAddress(),
                r.getLatitude(),
                r.getLongitude(),
                r.getVoteCount(),
                r.getPlaceUrl());
    }
}
