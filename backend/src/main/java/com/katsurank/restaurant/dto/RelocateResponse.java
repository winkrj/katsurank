package com.katsurank.restaurant.dto;

public record RelocateResponse(
        Long oldRestaurantId,
        Long newRestaurantId,
        int movedVoteCount) {
}
