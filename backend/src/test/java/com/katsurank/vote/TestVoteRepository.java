package com.katsurank.vote;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;

/** 테스트 전용 — 정리용 하드 삭제. 프로덕션 코드에서 사용 금지. */
public interface TestVoteRepository extends JpaRepository<Vote, Long> {

    @Transactional
    void deleteByUserIdIn(Collection<Long> userIds);
}
