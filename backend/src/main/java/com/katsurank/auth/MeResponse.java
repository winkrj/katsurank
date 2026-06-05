package com.katsurank.auth;

/** 현재 로그인 사용자의 최소 식별 정보 (프론트 authStore 와 동일 스키마). */
public record MeResponse(Long id, String nickname, String profileImage) {

    public static MeResponse from(AuthPrincipal principal) {
        return new MeResponse(principal.userId(), principal.nickname(), principal.profileImage());
    }
}
