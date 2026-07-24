package com.katsurank.auth.dto;

import org.springframework.security.web.csrf.CsrfToken;

/** CSRF 토큰을 SPA 에 알려주는 응답. 호출 자체가 XSRF-TOKEN 쿠키 발급을 트리거한다. */
public record CsrfTokenResponse(String token, String headerName, String parameterName) {

    public static CsrfTokenResponse from(CsrfToken token) {
        return new CsrfTokenResponse(token.getToken(), token.getHeaderName(), token.getParameterName());
    }
}
