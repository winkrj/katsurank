package com.katsurank.me.dto;

import com.katsurank.restaurant.RestaurantStatus;

import java.time.Instant;

public record CurrentVoteResponse(
        Long restaurantId,
        String restaurantName,
        RestaurantStatus restaurantStatus,
        Instant votedAt,
        Long rank) {
}
