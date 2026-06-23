package com.katsurank.common.web;

/** 에러 응답 본문. {@code code} 는 프론트가 분기에 쓰는 안정적 식별자, {@code message} 는 사용자 안내용. */
public record ApiError(String code, String message) {
}
