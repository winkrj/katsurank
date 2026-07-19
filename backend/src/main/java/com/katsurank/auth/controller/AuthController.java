package com.katsurank.auth.controller;

import com.katsurank.config.SecurityConfig;

import com.katsurank.auth.dto.CsrfTokenResponse;

import com.katsurank.auth.dto.MeResponse;

import com.katsurank.auth.AuthPrincipal;

import com.katsurank.common.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 인증 보조 엔드포인트.
 *
 * <p>로그인 자체는 Spring Security 의 {@code /oauth2/authorization/kakao} → 카카오 →
 * {@code /login/oauth2/code/kakao} 흐름이 처리한다. 로그아웃은 SecurityConfig 의 logout 설정이 담당한다.
 */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "인증", description = "로그인 상태 확인 · CSRF 토큰 발급 (로그인/로그아웃 자체는 /oauth2, /api/v1/auth/logout 참고)")
public class AuthController {

    /** 현재 로그인 사용자. 미인증이면 Security 가 401 을 반환한다. */
    @GetMapping("/me")
    @Operation(summary = "로그인 상태 확인", description = "세션 쿠키로 현재 로그인된 사용자를 조회한다.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "로그인되지 않음")
    public ApiResponse<MeResponse> me(@LoginUser AuthPrincipal principal) {
        return ApiResponse.success(MeResponse.from(principal));
    }

    /**
     * CSRF 토큰 발급(부트스트랩). SPA 가 최초 로드 시 한 번 호출하면 XSRF-TOKEN 쿠키가 내려간다.
     * {@link CsrfToken} 을 실제로 참조하는 순간 쿠키 저장소가 Set-Cookie 를 수행한다.
     */
    @GetMapping("/csrf")
    @Operation(summary = "CSRF 토큰 발급",
            description = "SPA가 최초 로드 시 한 번 호출한다. 호출하면 XSRF-TOKEN 쿠키가 내려가고, "
                    + "이후 POST/PATCH 등 변경 요청 시 그 값을 X-XSRF-TOKEN 헤더에 실어 보내야 한다.")
    public ApiResponse<CsrfTokenResponse> csrf(CsrfToken token) {
        return ApiResponse.success(CsrfTokenResponse.from(token));
    }
}
