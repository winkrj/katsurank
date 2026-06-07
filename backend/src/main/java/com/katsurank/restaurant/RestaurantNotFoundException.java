package com.katsurank.restaurant;

import com.katsurank.common.web.ApiException;
import org.springframework.http.HttpStatus;

/** 존재하지 않는 가게 조회 → 404. */
public class RestaurantNotFoundException extends ApiException {

    public RestaurantNotFoundException(Long id) {
        super(HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND", "가게를 찾을 수 없습니다. (id=" + id + ")");
    }
}
