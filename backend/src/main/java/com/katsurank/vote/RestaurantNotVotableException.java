package com.katsurank.vote;

import com.katsurank.common.web.ApiException;
import org.springframework.http.HttpStatus;

/** ACTIVE 가 아닌 가게(폐업·이전·심사중·거부)에 투표 시도 → 409. */
public class RestaurantNotVotableException extends ApiException {

    public RestaurantNotVotableException(Long restaurantId) {
        super(HttpStatus.CONFLICT, "RESTAURANT_NOT_VOTABLE",
                "지금 투표할 수 없는 가게입니다. (id=" + restaurantId + ")");
    }
}
