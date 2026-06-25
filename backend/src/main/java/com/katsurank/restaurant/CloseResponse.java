package com.katsurank.restaurant;

import java.time.Instant;

public record CloseResponse(
        Long id,
        String name,
        RestaurantStatus status,
        Instant closedAt) {

    public static CloseResponse from(Restaurant r) {
        return new CloseResponse(r.getId(), r.getName(), r.getStatus(), r.getClosedAt());
    }
}
