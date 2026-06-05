package com.katsurank.auth;

import java.util.Map;

/**
 * 카카오 {@code /v2/user/me} 응답에서 우리가 쓰는 최소 정보만 추출한다.
 *
 * <p>수집 항목: kakaoId, nickname, profileImage. <b>이메일 등 그 외 정보는 수집하지 않는다.</b>
 *
 * <p>닉네임/이미지는 동의 항목 구성에 따라 {@code kakao_account.profile} 또는 {@code properties}
 * 어느 쪽에든 올 수 있어 둘 다 살펴본다.
 */
public record KakaoUserInfo(Long kakaoId, String nickname, String profileImage) {

    @SuppressWarnings("unchecked")
    public static KakaoUserInfo from(Map<String, Object> attributes) {
        Object id = attributes.get("id");
        if (!(id instanceof Number kakaoId)) {
            throw new IllegalArgumentException("카카오 응답에 사용자 id 가 없습니다.");
        }

        Map<String, Object> account = asMap(attributes.get("kakao_account"));
        Map<String, Object> profile = account == null ? null : asMap(account.get("profile"));
        Map<String, Object> properties = asMap(attributes.get("properties"));

        String nickname = firstNonNull(
                value(profile, "nickname"),
                value(properties, "nickname"));
        String profileImage = firstNonNull(
                value(profile, "profile_image_url"),
                value(properties, "profile_image"));

        return new KakaoUserInfo(kakaoId.longValue(), nickname, profileImage);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object value) {
        return value instanceof Map<?, ?> map ? (Map<String, Object>) map : null;
    }

    private static String value(Map<String, Object> map, String key) {
        if (map == null) {
            return null;
        }
        return map.get(key) instanceof String s ? s : null;
    }

    private static String firstNonNull(String a, String b) {
        return a != null ? a : b;
    }
}
