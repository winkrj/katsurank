package com.katsurank.user;

import com.katsurank.common.web.ApiException;
import org.springframework.http.HttpStatus;

/** 존재해야 할 로그인 사용자를 찾을 수 없음 → 404. 세션은 유효한데 User 레코드가 없는 이례적 상황. */
public class UserNotFoundException extends ApiException {

    public UserNotFoundException(Long userId) {
        super(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다. (userId=" + userId + ")");
    }
}
