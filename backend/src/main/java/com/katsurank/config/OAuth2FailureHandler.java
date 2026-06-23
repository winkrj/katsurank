package com.katsurank.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * 카카오 인증 실패 시 SPA 로 302 리다이렉트하며 에러 사유를 쿼리로 전달한다.
 */
@Component
public class OAuth2FailureHandler implements AuthenticationFailureHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2FailureHandler.class);

    private final String frontendUrl;

    public OAuth2FailureHandler(AppProperties appProperties) {
        this.frontendUrl = appProperties.frontendUrl();
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        log.warn("OAuth2 로그인 실패: {}", exception.getMessage());
        String target = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth/callback")
                .queryParam("error", "login_failed")
                .encode(StandardCharsets.UTF_8)
                .build()
                .toUriString();
        response.sendRedirect(target);
    }
}
