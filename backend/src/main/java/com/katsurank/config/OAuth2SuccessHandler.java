package com.katsurank.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * 카카오 인증 성공 후 SPA 로 302 리다이렉트한다.
 *
 * <p>백엔드는 자기 화면을 띄우지 않는다. 세션 쿠키는 이 시점에 이미 발급되어 있으며,
 * 프론트는 리다이렉트 도착 후 {@code GET /api/v1/auth/me} 로 로그인 사용자를 확인한다.
 */
@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2SuccessHandler.class);

    private final String frontendUrl;

    public OAuth2SuccessHandler(AppProperties appProperties) {
        this.frontendUrl = appProperties.frontendUrl();
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        log.info("OAuth2 로그인 성공 principal={}", authentication.getName());
        response.sendRedirect(frontendUrl + "/oauth/callback");
    }
}
