package com.katsurank.comment.dto;

import com.katsurank.comment.Comment;
import com.katsurank.user.User;

import java.time.Instant;

public record CommentResponse(
        Long id,
        Long restaurantId,
        String content,
        CommentAuthorResponse author,
        Instant createdAt,
        Instant updatedAt) {

    public static CommentResponse from(Comment comment, User author) {
        return new CommentResponse(
                comment.getId(),
                comment.getRestaurantId(),
                comment.getContent(),
                new CommentAuthorResponse(author.getId(), author.getNickname(), author.getProfileImage()),
                comment.getCreatedAt(),
                comment.getUpdatedAt());
    }
}
