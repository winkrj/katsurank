package com.katsurank.me;

public record MeResponse(
        Long id,
        String nickname,
        String profileImage,
        CurrentVoteResponse currentVote) {
}
