package com.katsurank.restaurant;

import com.katsurank.common.web.ApiException;
import org.springframework.http.HttpStatus;

/** 이미 등록된 {@code kakao_place_id} 재등록 시도 → 409. */
public class DuplicatePlaceException extends ApiException {

    public DuplicatePlaceException(String kakaoPlaceId) {
        super(HttpStatus.CONFLICT, "DUPLICATE_PLACE",
                "이미 등록된 가게입니다. (kakaoPlaceId=" + kakaoPlaceId + ")");
    }
}
