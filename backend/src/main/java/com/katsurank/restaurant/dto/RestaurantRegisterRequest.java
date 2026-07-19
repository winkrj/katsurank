package com.katsurank.restaurant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * 가게 등록 요청. 프론트가 카카오 검색 결과({@code GET /api/v1/kakao-places/search})에서 고른 장소를 그대로 보낸다.
 * 등록자(createdBy)는 본문이 아니라 로그인 세션에서 얻는다.
 */
public record RestaurantRegisterRequest(
        @NotBlank @Size(max = 50) String kakaoPlaceId,
        @NotBlank @Size(max = 200) String name,
        @Size(max = 500) String address,
        @Size(max = 500) String roadAddress,
        @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal latitude,
        @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal longitude,
        @Size(max = 200) String kakaoCategory,
        @Size(max = 30) String phone,
        @Size(max = 500) String placeUrl) {
}
