package com.katsurank.ranking;

import com.katsurank.common.web.ApiException;
import org.springframework.http.HttpStatus;

public class LimitExceededException extends ApiException {

    public LimitExceededException() {
        super(HttpStatus.BAD_REQUEST, "LIMIT_EXCEEDED", "limit은 1 이상 100 이하여야 합니다.");
    }
}
