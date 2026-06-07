package com.katsurank.common.web;

import org.springframework.http.HttpStatus;

/**
 * HTTP 상태와 안정적인 에러 코드를 함께 들고 다니는 도메인 예외의 기반 클래스.
 *
 * <p>각 도메인은 이 클래스를 상속해 자신만의 예외를 정의하고,
 * {@link GlobalExceptionHandler} 가 일관된 {@link ApiError} 본문으로 변환한다.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public ApiException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus status() {
        return status;
    }

    public String code() {
        return code;
    }
}
