package com.katsurank.vote.exception;

import com.katsurank.common.domain.DomainException;

/**
 * 낙관적 락/유니크 경합으로 재시도 한도를 초과한 경우 → 409.
 * 일시적 동시성 충돌이므로 클라이언트는 잠시 후 재시도하면 된다.
 */
public class VoteConflictException extends DomainException {

    public VoteConflictException() {
        super("VOTE_CONFLICT",
                "투표 요청이 몰려 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
}
