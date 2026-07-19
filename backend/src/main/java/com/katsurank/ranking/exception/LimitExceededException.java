package com.katsurank.ranking.exception;

import com.katsurank.common.domain.DomainException;

public class LimitExceededException extends DomainException {

    public LimitExceededException() {
        super("LIMIT_EXCEEDED", "limit은 1 이상 100 이하여야 합니다.");
    }
}
