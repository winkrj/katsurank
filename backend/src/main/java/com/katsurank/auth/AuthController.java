package com.katsurank.auth;

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
public class AuthController {

    /** 현재 로그인 사용자. 미인증이면 Security 가 401 을 반환한다. */
    @GetMapping("/me")
    public MeResponse me(@LoginUser AuthPrincipal principal) {
        return MeResponse.from(principal);
    }

    /**
     * CSRF 토큰 발급(부트스트랩). SPA 가 최초 로드 시 한 번 호출하면 XSRF-TOKEN 쿠키가 내려간다.
     * {@link CsrfToken} 을 실제로 참조하는 순간 쿠키 저장소가 Set-Cookie 를 수행한다.
     */
    @GetMapping("/csrf")
    public CsrfTokenResponse csrf(CsrfToken token) {
        return CsrfTokenResponse.from(token);
    }
}
