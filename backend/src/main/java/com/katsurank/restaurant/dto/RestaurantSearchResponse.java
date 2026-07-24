package com.katsurank.restaurant.dto;

import com.katsurank.restaurant.Restaurant;

/** 검색 결과 DTO. ACTIVE만 반환하므로 status 필드를 포함하지 않는다. */
public record RestaurantSearchResponse(
        Long id,
        String name,
        String address,
        int voteCount,
        long rank,
        String placeUrl) {

    public static RestaurantSearchResponse from(Restaurant r, long rank) {
        return new RestaurantSearchResponse(
                r.getId(),
                r.getName(),
                r.getAddress(),
                r.getVoteCount(),
                rank,
                r.getPlaceUrl());
    }
}
