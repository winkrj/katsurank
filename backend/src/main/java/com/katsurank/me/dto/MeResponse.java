package com.katsurank.me.dto;

public record MeResponse(
        Long id,
        String nickname,
        String profileImage,
        CurrentVoteResponse currentVote) {
}
