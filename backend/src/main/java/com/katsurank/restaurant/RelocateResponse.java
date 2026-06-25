package com.katsurank.restaurant;

public record RelocateResponse(
        Long oldRestaurantId,
        Long newRestaurantId,
        int movedVoteCount) {
}
