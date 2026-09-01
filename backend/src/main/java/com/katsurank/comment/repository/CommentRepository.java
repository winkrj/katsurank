package com.katsurank.comment.repository;

import com.katsurank.comment.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    boolean existsByRestaurantIdAndUserId(Long restaurantId, Long userId);

    Optional<Comment> findByRestaurantIdAndUserId(Long restaurantId, Long userId);

    Optional<Comment> findByIdAndRestaurantId(Long id, Long restaurantId);
}
