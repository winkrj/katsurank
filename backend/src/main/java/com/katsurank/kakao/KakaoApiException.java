package com.katsurank.kakao;

import com.katsurank.common.web.ApiException;
import org.springframework.http.HttpStatus;

/** 카카오 로컬 API 호출 실패. 외부 의존 장애이므로 502 로 노출한다. */
public class KakaoApiException extends ApiException {

    public KakaoApiException(String message) {
        super(HttpStatus.BAD_GATEWAY, "KAKAO_API_ERROR", message);
    }
}
