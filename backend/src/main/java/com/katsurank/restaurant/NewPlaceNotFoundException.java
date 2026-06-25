package com.katsurank.restaurant;

import com.katsurank.common.web.ApiException;
import org.springframework.http.HttpStatus;

public class NewPlaceNotFoundException extends ApiException {

    public NewPlaceNotFoundException(String kakaoPlaceId) {
        super(HttpStatus.NOT_FOUND, "NEW_PLACE_NOT_FOUND",
                "이전 대상 가게가 등록되어 있지 않습니다. (kakaoPlaceId=" + kakaoPlaceId + ")");
    }
}
