package com.katsurank.vote.repository;

import com.katsurank.vote.Vote;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VoteRepository extends JpaRepository<Vote, Long> {

    Optional<Vote> findByUserIdAndCurrentIsTrue(Long userId);

    long countByRestaurantIdAndCurrentIsTrue(Long restaurantId);

    List<Vote> findByRestaurantIdAndCurrentIsTrue(Long restaurantId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE Vote v SET v.current = false WHERE v.restaurantId = :restaurantId AND v.current = true")
    int archiveCurrentVotes(@Param("restaurantId") Long restaurantId);
}
