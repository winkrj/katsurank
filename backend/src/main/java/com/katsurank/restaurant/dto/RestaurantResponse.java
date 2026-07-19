package com.katsurank.restaurant.dto;

import com.katsurank.restaurant.Restaurant;

import com.katsurank.restaurant.RestaurantStatus;

import java.math.BigDecimal;
import java.time.Instant;

/** 가게 응답 DTO. 엔티티를 직접 노출하지 않는다. */
public record RestaurantResponse(
        Long id,
        String kakaoPlaceId,
        String name,
        String address,
        String roadAddress,
        BigDecimal latitude,
        BigDecimal longitude,
        String kakaoCategory,
        String phone,
        String placeUrl,
        RestaurantStatus status,
        String category,
        int voteCount,
        Long rank,
        Instant createdAt) {

    public static RestaurantResponse from(Restaurant r, Long rank) {
        return new RestaurantResponse(
                r.getId(),
                r.getKakaoPlaceId(),
                r.getName(),
                r.getAddress(),
                r.getRoadAddress(),
                r.getLatitude(),
                r.getLongitude(),
                r.getKakaoCategory(),
                r.getPhone(),
                r.getPlaceUrl(),
                r.getStatus(),
                r.getCategory(),
                r.getVoteCount(),
                rank,
                r.getCreatedAt());
    }

    public static RestaurantResponse from(Restaurant r) {
        return from(r, null);
    }
}
