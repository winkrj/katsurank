package com.katsurank.restaurant;

import com.katsurank.common.web.ApiException;
import org.springframework.http.HttpStatus;

public class AlreadyClosedException extends ApiException {

    public AlreadyClosedException(Long restaurantId) {
        super(HttpStatus.CONFLICT, "ALREADY_CLOSED",
                "이미 폐업/이전 처리된 가게입니다. (id=" + restaurantId + ")");
    }
}
