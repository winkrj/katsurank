package com.katsurank.restaurant.exception;

import com.katsurank.common.domain.DomainException;

/** 이미 등록된 {@code kakao_place_id} 재등록 시도 → 409. */
public class DuplicatePlaceException extends DomainException {

    public DuplicatePlaceException(String kakaoPlaceId) {
        super("DUPLICATE_PLACE",
                "이미 등록된 가게입니다. (kakaoPlaceId=" + kakaoPlaceId + ")");
    }
}
