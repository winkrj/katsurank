package com.katsurank.user.exception;

import com.katsurank.user.User;

import com.katsurank.common.domain.DomainException;

/** 존재해야 할 로그인 사용자를 찾을 수 없음 → 404. 세션은 유효한데 User 레코드가 없는 이례적 상황. */
public class UserNotFoundException extends DomainException {

    public UserNotFoundException(Long userId) {
        super("USER_NOT_FOUND", "사용자를 찾을 수 없습니다. (userId=" + userId + ")");
    }
}
