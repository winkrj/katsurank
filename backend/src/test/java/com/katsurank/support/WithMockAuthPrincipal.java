package com.katsurank.support;

import org.springframework.security.test.context.support.WithSecurityContext;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

@Retention(RetentionPolicy.RUNTIME)
@WithSecurityContext(factory = MockAuthPrincipalSecurityContextFactory.class)
public @interface WithMockAuthPrincipal {

    long userId() default 1L;

    long kakaoId() default 100L;

    String nickname() default "테스터";

    String profileImage() default "";
}
