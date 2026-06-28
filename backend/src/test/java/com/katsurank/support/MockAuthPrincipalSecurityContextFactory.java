package com.katsurank.support;

import com.katsurank.auth.AuthPrincipal;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.test.context.support.WithSecurityContextFactory;

public class MockAuthPrincipalSecurityContextFactory
        implements WithSecurityContextFactory<WithMockAuthPrincipal> {

    @Override
    public SecurityContext createSecurityContext(WithMockAuthPrincipal annotation) {
        AuthPrincipal principal = new AuthPrincipal(
                annotation.userId(),
                annotation.kakaoId(),
                annotation.nickname(),
                annotation.profileImage().isEmpty() ? null : annotation.profileImage());

        OAuth2AuthenticationToken token = new OAuth2AuthenticationToken(
                principal, principal.getAuthorities(), "kakao");

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(token);
        return context;
    }
}
