package com.katsurank.restaurant.exception;

import com.katsurank.common.domain.DomainException;

public class AlreadyClosedException extends DomainException {

    public AlreadyClosedException(Long restaurantId) {
        super("ALREADY_CLOSED",
                "이미 폐업/이전 처리된 가게입니다. (id=" + restaurantId + ")");
    }
}
