/**
 * 투표(Vote) — 1인 1표 + 표 이동. 단일 트랜잭션·동시성(낙관적 락)·히스토리 보존.
 *
 * <p>정합성 3중 방어는 {@link com.katsurank.vote.VoteService} 참고:
 * 부분 유니크 인덱스(1인 1표) + Restaurant {@code @Version}(vote_count 분실 갱신 방지) + 충돌 재시도.
 */
package com.katsurank.vote;
