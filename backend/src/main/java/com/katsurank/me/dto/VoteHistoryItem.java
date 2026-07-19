package com.katsurank.me.dto;

import com.katsurank.restaurant.Restaurant;
import com.katsurank.restaurant.RestaurantStatus;
import com.katsurank.vote.Vote;

import java.time.Instant;

public record VoteHistoryItem(
        Long restaurantId,
        String restaurantName,
        RestaurantStatus restaurantStatus,
        Instant votedAt,
        boolean isCurrent) {

    public static VoteHistoryItem from(Vote vote, Restaurant restaurant) {
        return new VoteHistoryItem(
                restaurant.getId(),
                restaurant.getName(),
                restaurant.getStatus(),
                vote.getVotedAt(),
                vote.isCurrent());
    }
}
