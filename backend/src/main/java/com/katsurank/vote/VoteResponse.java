package com.katsurank.vote;

import com.katsurank.restaurant.Restaurant;

import java.time.Instant;

/** 투표 결과 — 현재 유효표와, 그 표가 향한 가게의 갱신된 표수. */
public record VoteResponse(
        Long voteId,
        Long restaurantId,
        String restaurantName,
        int voteCount,
        Instant votedAt) {

    static VoteResponse of(Vote vote, Restaurant restaurant) {
        return new VoteResponse(
                vote.getId(),
                restaurant.getId(),
                restaurant.getName(),
                restaurant.getVoteCount(),
                vote.getVotedAt());
    }
}
