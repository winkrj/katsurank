package com.katsurank.restaurant.exception;

import com.katsurank.common.domain.DomainException;

/** 존재하지 않는 가게 조회 → 404. */
public class RestaurantNotFoundException extends DomainException {

    public RestaurantNotFoundException(Long id) {
        super("RESTAURANT_NOT_FOUND", "가게를 찾을 수 없습니다. (id=" + id + ")");
    }
}
