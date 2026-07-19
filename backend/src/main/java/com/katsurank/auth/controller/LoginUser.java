package com.katsurank.auth.controller;

import com.katsurank.auth.dto.MeResponse;

import com.katsurank.auth.AuthPrincipal;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 컨트롤러 메서드 파라미터에 현재 로그인 사용자를 주입한다.
 *
 * <pre>{@code
 * @GetMapping("/api/v1/auth/me")
 * public MeResponse me(@LoginUser AuthPrincipal principal) { ... }
 * }</pre>
 *
 * <p>인증이 보장된(Security 로 보호된) 엔드포인트에서 사용한다. 미인증 요청에서는 {@code null} 이 주입된다.
 *
 * @see LoginUserArgumentResolver
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface LoginUser {
}
