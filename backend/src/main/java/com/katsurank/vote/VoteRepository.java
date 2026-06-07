package com.katsurank.vote;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Optional;

public interface VoteRepository extends JpaRepository<Vote, Long> {

    /** 사용자의 현재 유효표(부분 유니크 인덱스로 최대 1건 보장). */
    Optional<Vote> findByUserIdAndCurrentIsTrue(Long userId);

    /** 가게의 현재 유효표 수 — vote_count 캐시 검증/관측용. */
    long countByRestaurantIdAndCurrentIsTrue(Long restaurantId);

    /** 테스트 정리용 — 특정 사용자들의 표 일괄 삭제. (파생 delete 는 트랜잭션이 필요) */
    @Transactional
    void deleteByUserIdIn(Collection<Long> userIds);
}
