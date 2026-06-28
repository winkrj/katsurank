package com.katsurank.support;

import com.katsurank.auth.AuthPrincipal;
import com.katsurank.user.User;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;

public final class TestAuth {

    private TestAuth() {
    }

    public static RequestPostProcessor oauth2(User user) {
        AuthPrincipal principal = new AuthPrincipal(
                user.getId(), user.getKakaoId(), user.getNickname(), null);
        OAuth2AuthenticationToken token = new OAuth2AuthenticationToken(
                principal, principal.getAuthorities(), "kakao");
        return authentication(token);
    }
}
