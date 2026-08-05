package com.katsurank.me.dto;

import com.katsurank.restaurant.RestaurantStatus;

import java.time.Instant;

public record VoteHistoryItem(
        Long restaurantId,
        String restaurantName,
        RestaurantStatus restaurantStatus,
        Instant votedAt,
        boolean isCurrent) {
}
