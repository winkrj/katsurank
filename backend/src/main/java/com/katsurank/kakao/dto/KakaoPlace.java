package com.katsurank.kakao.dto;

import java.math.BigDecimal;

/**
 * 카카오 로컬 검색 결과를 우리 도메인 표현으로 정규화한 값.
 *
 * <p>카카오 응답의 {@code x}=경도(longitude), {@code y}=위도(latitude) 를 뒤집어 담지 않도록 주의.
 * 가게 등록 시 프론트가 이 값을 그대로 {@code POST /api/v1/restaurants} 로 보낸다.
 */
public record KakaoPlace(
        String kakaoPlaceId,
        String name,
        String address,
        String roadAddress,
        BigDecimal latitude,
        BigDecimal longitude,
        String category,
        String phone,
        String placeUrl) {
}
