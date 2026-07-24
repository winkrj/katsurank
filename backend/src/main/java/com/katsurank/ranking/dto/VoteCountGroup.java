package com.katsurank.ranking.dto;

/** 동일 득표 수를 가진 ACTIVE 가게 수. 서울 전체 순위 계산에 사용한다. */
public record VoteCountGroup(
        int voteCount,
        long restaurantCount) {
}
