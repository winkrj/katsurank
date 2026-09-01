package com.katsurank.restaurant.repository;

import com.katsurank.restaurant.Restaurant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.Optional;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    boolean existsByKakaoPlaceId(String kakaoPlaceId);

    Optional<Restaurant> findByKakaoPlaceId(String kakaoPlaceId);

    /** 가게 상태와 함께 처리해야 하는 다른 도메인의 mutation을 폐업·이전과 직렬화한다. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Restaurant r WHERE r.id = :id")
    Optional<Restaurant> findByIdForUpdate(@Param("id") Long id);
}
