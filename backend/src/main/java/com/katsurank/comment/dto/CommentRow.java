package com.katsurank.comment.dto;

import java.time.Instant;

/** 댓글 목록 조회 전용 projection. */
public record CommentRow(
        Long id,
        Long restaurantId,
        String content,
        Long authorId,
        String authorNickname,
        String authorProfileImage,
        Instant createdAt,
        Instant updatedAt) {

    public CommentResponse toResponse() {
        return new CommentResponse(
                id,
                restaurantId,
                content,
                new CommentAuthorResponse(authorId, authorNickname, authorProfileImage),
                createdAt,
                updatedAt);
    }
}
