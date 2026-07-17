package com.katsurank.restaurant;

import java.util.List;

public record RestaurantSearchPageResponse(
        List<RestaurantSearchResponse> items,
        long total,
        int offset,
        int limit) {
}
