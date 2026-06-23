package com.katsurank.auth;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.io.Serial;
import java.io.Serializable;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * 세션에 저장되는 인증 주체.
 *
 * <p>{@link OAuth2User} 로서 Spring Security 가 다루고, {@link Serializable} 이라
 * spring-session-jdbc 가 외부 저장소(PostgreSQL)에 직렬화해 보관한다.
 * 따라서 모든 필드는 직렬화 가능한 최소 식별 정보(우리 DB의 user id + 카카오 프로필)만 담는다.
 */
public final class AuthPrincipal implements OAuth2User, Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private final Long userId;
    private final Long kakaoId;
    private final String nickname;
    private final String profileImage;

    public AuthPrincipal(Long userId, Long kakaoId, String nickname, String profileImage) {
        this.userId = userId;
        this.kakaoId = kakaoId;
        this.nickname = nickname;
        this.profileImage = profileImage;
    }

    public Long userId() {
        return userId;
    }

    public Long kakaoId() {
        return kakaoId;
    }

    public String nickname() {
        return nickname;
    }

    public String profileImage() {
        return profileImage;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return Map.of("id", kakaoId);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    /** 세션의 PRINCIPAL_NAME 으로 쓰이는 값 — 카카오 user-name-attribute(id) 와 일치시킨다. */
    @Override
    public String getName() {
        return String.valueOf(kakaoId);
    }
}
