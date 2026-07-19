package com.katsurank.me.dto;

import com.katsurank.restaurant.RestaurantStatus;

import java.time.Instant;

/** 마이페이지 현재 투표 조회 전용 projection. */
public record CurrentVoteRow(
        Long restaurantId,
        String restaurantName,
        RestaurantStatus restaurantStatus,
        Instant votedAt,
        int voteCount) {

    public CurrentVoteResponse toResponse(Long rank) {
        return new CurrentVoteResponse(restaurantId, restaurantName, restaurantStatus, votedAt, rank);
    }
}
