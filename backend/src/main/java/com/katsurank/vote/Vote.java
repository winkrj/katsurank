package com.katsurank.vote;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * 한 사용자의 한 가게에 대한 1표.
 *
 * <p>1인 1표는 DB 가 최종 보장한다: {@code votes} 에 부분 유니크 인덱스
 * {@code (user_id) WHERE is_current = TRUE}. 표를 옮기면 기존 표는 {@code is_current=false} 로
 * 박제되어 히스토리로 남고(=hard delete 금지), 새 표가 유효표가 된다.
 *
 * <p>{@code restaurant}·{@code user} 는 식별자(Long)로만 참조한다 — 표 이동 트랜잭션은 경합되는
 * {@code Restaurant.vote_count} 만 낙관적 락으로 다루므로 연관 엔티티를 끌고 다닐 필요가 없다.
 */
@Entity
@Table(name = "votes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Vote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "restaurant_id", nullable = false, updatable = false)
    private Long restaurantId;

    @Column(name = "voted_at", nullable = false, updatable = false)
    private Instant votedAt;

    /** 현재 유효한 1표인지. 표를 옮기면 false 로 박제된다. */
    @Column(name = "is_current", nullable = false)
    private boolean current;

    private Vote(Long userId, Long restaurantId) {
        this.userId = userId;
        this.restaurantId = restaurantId;
        this.votedAt = Instant.now();
        this.current = true;
    }

    /** 새 유효표를 발행한다(is_current=true). */
    public static Vote cast(Long userId, Long restaurantId) {
        return new Vote(userId, restaurantId);
    }

    /** 표 이동 시 기존 표를 박제한다(is_current=false). 표·히스토리는 보존된다. */
    public void deactivate() {
        this.current = false;
    }
}
