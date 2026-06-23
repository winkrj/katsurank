package com.katsurank.restaurant;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

/**
 * 가게 등록 요청. 프론트가 카카오 검색 결과({@code GET /api/v1/kakao-places/search})에서 고른 장소를 그대로 보낸다.
 * 등록자(createdBy)는 본문이 아니라 로그인 세션에서 얻는다.
 */
public record RestaurantRegisterRequest(
        @NotBlank String kakaoPlaceId,
        @NotBlank String name,
        String address,
        String roadAddress,
        BigDecimal latitude,
        BigDecimal longitude,
        String kakaoCategory,
        String phone,
        String placeUrl) {
}
