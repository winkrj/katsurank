package com.katsurank.comment.exception;

import com.katsurank.common.domain.DomainException;

public class CommentNotFoundException extends DomainException {

    public CommentNotFoundException(Long commentId) {
        super("COMMENT_NOT_FOUND", "댓글을 찾을 수 없습니다. (id=" + commentId + ")");
    }
}
