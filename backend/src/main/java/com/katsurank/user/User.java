package com.katsurank.user;

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
 * 카카오 계정 기반 사용자.
 *
 * <p>두꺼운 도메인 모델 — 가입/로그인 시 상태 변경은 엔티티 메서드로만 수행한다(setter 미노출).
 * 모든 시각은 UTC({@link Instant})로 저장하고, 표시 시점에만 KST 로 변환한다.
 *
 * <p>{@code current_vote_id} 컬럼은 투표 도메인이 소유·갱신하므로 여기서는 매핑하지 않는다.
 */
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "kakao_id", nullable = false, unique = true, updatable = false)
    private Long kakaoId;

    @Column(name = "nickname", length = 50)
    private String nickname;

    @Column(name = "profile_image", length = 500)
    private String profileImage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    /** 현재 유효 1표(Vote.id) 빠른 조회용 캐시. 투표 도메인이 갱신한다. */
    @Column(name = "current_vote_id")
    private Long currentVoteId;

    private User(Long kakaoId, String nickname, String profileImage) {
        this.kakaoId = kakaoId;
        this.nickname = nickname;
        this.profileImage = profileImage;
        Instant now = Instant.now();
        this.createdAt = now;
        this.lastLoginAt = now;
    }

    /** 카카오 최초 로그인 시 신규 가입. */
    public static User register(Long kakaoId, String nickname, String profileImage) {
        return new User(kakaoId, nickname, profileImage);
    }

    /** 재로그인 — 카카오에서 받은 최신 프로필로 갱신하고 마지막 로그인 시각을 찍는다. */
    public void login(String nickname, String profileImage) {
        this.nickname = nickname;
        this.profileImage = profileImage;
        this.lastLoginAt = Instant.now();
    }

    /** 현재 1순위(유효 표)를 가리키도록 캐시를 갱신한다. (투표 도메인 트랜잭션 안에서만 호출) */
    public void pointCurrentVoteTo(Long voteId) {
        this.currentVoteId = voteId;
    }
}
