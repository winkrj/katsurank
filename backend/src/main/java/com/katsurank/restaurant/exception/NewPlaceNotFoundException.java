package com.katsurank.restaurant.exception;

import com.katsurank.common.domain.DomainException;

public class NewPlaceNotFoundException extends DomainException {

    public NewPlaceNotFoundException(String kakaoPlaceId) {
        super("NEW_PLACE_NOT_FOUND",
                "이전 대상 가게가 등록되어 있지 않습니다. (kakaoPlaceId=" + kakaoPlaceId + ")");
    }
}
