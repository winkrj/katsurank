package com.katsurank.restaurant;

import com.katsurank.common.web.ApiException;
import org.springframework.http.HttpStatus;

public class MissingQueryException extends ApiException {

    public MissingQueryException() {
        super(HttpStatus.BAD_REQUEST, "MISSING_QUERY", "검색어(q)는 필수입니다.");
    }
}
