package com.katsurank.restaurant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    boolean existsByKakaoPlaceId(String kakaoPlaceId);

    Optional<Restaurant> findByKakaoPlaceId(String kakaoPlaceId);

    @Query("SELECT r FROM Restaurant r WHERE r.status = :status ORDER BY r.voteCount DESC, r.id ASC")
    Page<Restaurant> findRanking(@Param("status") RestaurantStatus status, Pageable pageable);

    Optional<Restaurant> findFirstByStatusOrderByVoteCountDescIdAsc(RestaurantStatus status);
}
