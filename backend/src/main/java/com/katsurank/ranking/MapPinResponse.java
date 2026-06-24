package com.katsurank.ranking;

import com.katsurank.restaurant.Restaurant;

import java.math.BigDecimal;

public record MapPinResponse(
        Long id,
        String name,
        BigDecimal latitude,
        BigDecimal longitude,
        int voteCount) {

    public static MapPinResponse from(Restaurant r) {
        return new MapPinResponse(
                r.getId(),
                r.getName(),
                r.getLatitude(),
                r.getLongitude(),
                r.getVoteCount());
    }
}
