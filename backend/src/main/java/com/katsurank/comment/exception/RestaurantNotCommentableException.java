package com.katsurank.comment.exception;

import com.katsurank.common.domain.DomainException;

public class RestaurantNotCommentableException extends DomainException {

    public RestaurantNotCommentableException(Long restaurantId) {
        super("RESTAURANT_NOT_COMMENTABLE",
                "지금 댓글을 작성하거나 수정할 수 없는 가게입니다. (id=" + restaurantId + ")");
    }
}
