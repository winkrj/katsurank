package com.katsurank.ranking.exception;

import com.katsurank.common.domain.DomainException;

/** 랭킹 기능에서 직접 조회한 가게가 존재하지 않을 때 사용하는 동일 API 계약의 예외. */
public class RankingRestaurantNotFoundException extends DomainException {

    public RankingRestaurantNotFoundException(Long restaurantId) {
        super("RESTAURANT_NOT_FOUND", "가게를 찾을 수 없습니다. (id=" + restaurantId + ")");
    }
}
