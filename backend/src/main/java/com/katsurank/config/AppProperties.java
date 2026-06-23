package com.katsurank.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * 인증·보안 관련 환경 설정 (application.yml 의 {@code app.*}).
 *
 * @param frontendUrl OAuth 성공 후 302 로 돌려보낼 프론트 오리진 (로컬 http://localhost:3000)
 * @param cors        CORS 허용 오리진
 * @param cookie      세션/CSRF 쿠키 속성 (도메인·Secure·SameSite)
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(String frontendUrl, Cors cors, Cookie cookie) {

    public record Cors(List<String> allowedOrigins) {
    }

    /**
     * @param domain   쿠키 도메인. 운영은 {@code .katsurank.kr}, 로컬은 비움(null/blank → 미설정).
     * @param secure   HTTPS 전용 여부. 운영 true, 로컬 false.
     * @param sameSite SameSite 속성. 프론트·백엔드가 같은 사이트(서브도메인)이므로 {@code Lax} 면 충분.
     */
    public record Cookie(String domain, boolean secure, String sameSite) {
    }
}
