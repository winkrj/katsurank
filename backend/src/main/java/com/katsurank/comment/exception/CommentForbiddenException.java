package com.katsurank.comment.exception;

import com.katsurank.common.domain.DomainException;

public class CommentForbiddenException extends DomainException {

    public CommentForbiddenException(Long commentId) {
        super("COMMENT_FORBIDDEN", "본인의 댓글만 변경할 수 있습니다. (id=" + commentId + ")");
    }
}
