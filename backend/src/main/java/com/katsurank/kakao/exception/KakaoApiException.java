package com.katsurank.kakao.exception;

import com.katsurank.common.domain.DomainException;

/** 카카오 로컬 API 호출 실패. 외부 의존 장애이므로 502 로 노출한다. */
public class KakaoApiException extends DomainException {

    public KakaoApiException(String message) {
        super("KAKAO_API_ERROR", message);
    }

    public KakaoApiException(String message, Throwable cause) {
        super("KAKAO_API_ERROR", message, cause);
    }
}
