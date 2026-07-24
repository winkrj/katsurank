package com.katsurank.common.domain;

/** HTTP와 무관한 도메인 오류의 공통 기반 클래스. */
public abstract class DomainException extends RuntimeException {

    private final String code;

    protected DomainException(String code, String message) {
        super(message);
        this.code = code;
    }

    protected DomainException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public final String code() {
        return code;
    }
}
