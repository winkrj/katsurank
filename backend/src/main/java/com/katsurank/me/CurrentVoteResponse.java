package com.katsurank.me;

import com.katsurank.restaurant.Restaurant;
import com.katsurank.restaurant.RestaurantStatus;
import com.katsurank.vote.Vote;

import java.time.Instant;

public record CurrentVoteResponse(
        Long restaurantId,
        String restaurantName,
        RestaurantStatus restaurantStatus,
        Instant votedAt,
        Long rank) {

    public static CurrentVoteResponse of(Vote vote, Restaurant restaurant, Long rank) {
        return new CurrentVoteResponse(
                restaurant.getId(),
                restaurant.getName(),
                restaurant.getStatus(),
                vote.getVotedAt(),
                rank);
    }
}
