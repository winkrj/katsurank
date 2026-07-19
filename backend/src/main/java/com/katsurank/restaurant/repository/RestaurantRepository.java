package com.katsurank.restaurant.repository;

import com.katsurank.restaurant.Restaurant;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    boolean existsByKakaoPlaceId(String kakaoPlaceId);

    Optional<Restaurant> findByKakaoPlaceId(String kakaoPlaceId);
}
