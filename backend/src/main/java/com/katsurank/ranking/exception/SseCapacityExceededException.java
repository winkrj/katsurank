package com.katsurank.ranking.exception;

import com.katsurank.common.domain.DomainException;

/** 랭킹 SSE 연결 상한을 초과한 경우 잠시 후 재연결하도록 503으로 응답한다. */
public class SseCapacityExceededException extends DomainException {

    public SseCapacityExceededException(int maxConnections) {
        super("SSE_CAPACITY_EXCEEDED",
                "실시간 랭킹 연결이 가득 찼습니다. 잠시 후 다시 시도해 주세요. (max=" + maxConnections + ")");
    }
}
