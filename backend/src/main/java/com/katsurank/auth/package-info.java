/**
 * 인증 — 카카오 OAuth2 + 외부저장소 세션(spring-session-jdbc). JWT 미채택.
 *
 * <p>{@link com.katsurank.auth.service.CustomOAuth2UserService} 가 카카오 프로필로 User 를 upsert 하고
 * 세션에 {@link com.katsurank.auth.AuthPrincipal} 을 저장한다. 컨트롤러는
 * {@link com.katsurank.auth.controller.LoginUser} 로 현재 사용자를 주입받는다. 보안 설정은 {@code config} 패키지.
 */
package com.katsurank.auth;
