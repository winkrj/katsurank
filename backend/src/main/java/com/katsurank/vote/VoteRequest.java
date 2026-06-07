package com.katsurank.vote;

import jakarta.validation.constraints.NotNull;

/** 투표 / 표 이동 요청 — 옮겨갈(또는 처음 찍을) 가게 id. 사용자는 세션에서 식별한다. */
public record VoteRequest(@NotNull Long restaurantId) {
}
