package com.katsurank.vote.exception;

import com.katsurank.common.domain.DomainException;

/** ACTIVE 가 아닌 가게(폐업·이전·심사중·거부)에 투표 시도 → 409. */
public class RestaurantNotVotableException extends DomainException {

    public RestaurantNotVotableException(Long restaurantId) {
        super("RESTAURANT_NOT_VOTABLE",
                "지금 투표할 수 없는 가게입니다. (id=" + restaurantId + ")");
    }
}
