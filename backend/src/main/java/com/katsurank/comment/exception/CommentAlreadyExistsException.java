package com.katsurank.comment.exception;

import com.katsurank.common.domain.DomainException;

public class CommentAlreadyExistsException extends DomainException {

    public CommentAlreadyExistsException(Long restaurantId, Long userId) {
        super("COMMENT_ALREADY_EXISTS",
                "이미 이 가게에 댓글을 작성했습니다. (restaurantId=" + restaurantId + ", userId=" + userId + ")");
    }
}
