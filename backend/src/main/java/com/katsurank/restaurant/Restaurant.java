package com.katsurank.restaurant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * 가게 — 카카오 place 레코드 1건당 1 Restaurant. 체인점은 지점마다 독립 레코드.
 *
 * <p>두꺼운 도메인 모델(setter 미노출). 등록은 ACTIVE 로 생성된다 — 카테고리 화이트리스트 미달은
 * 서비스 계층에서 거부(영속하지 않음)하므로, 자동 등록 경로로는 REJECTED 레코드를 만들지 않는다.
 * (REJECTED 상태값은 운영자 수동 모더레이션 등 후속 흐름을 위해 enum 에 남겨 둔다.)
 * hard delete 금지 — 폐업/이전은 상태로만 관리한다(폐업/이전 로직은 후속 작업).
 * {@code vote_count} 와 그 동시성 제어(@Version)는 투표 도메인 소관이라 아직 다루지 않는다.
 */
@Entity
@Table(name = "restaurants")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 카카오 place 레코드 식별자. UNIQUE — 중복/지점 구분의 1차 방어선. */
    @Column(name = "kakao_place_id", length = 50, nullable = false, unique = true, updatable = false)
    private String kakaoPlaceId;

    @Column(name = "name", length = 200, nullable = false)
    private String name;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "road_address", length = 500)
    private String roadAddress;

    @Column(name = "latitude", precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "kakao_category", length = 200)
    private String kakaoCategory;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "place_url", length = 500)
    private String placeUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private RestaurantStatus status;

    /** 서비스 카테고리. V2 확장 대비 — MVP 는 돈까스 단일. */
    @Column(name = "category", length = 50, nullable = false)
    private String category;

    /** 비정규화 캐시. 투표 도메인이 갱신한다(여기서는 등록 시 0). */
    @Column(name = "vote_count", nullable = false)
    private int voteCount;

    /**
     * 낙관적 락 버전. 표 이동 시 동시 갱신되는 {@code vote_count} 의 분실 갱신(lost update)을 막는다.
     * 충돌 시 {@code OptimisticLockingFailureException} → 투표 도메인이 재시도한다.
     */
    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    /** 이전(RELOCATED) 시 새 레코드 연결. 후속 작업 — 등록 시엔 null. */
    @Column(name = "relocated_to_id")
    private Long relocatedToId;

    /** 폐업(CLOSED) 시점. 후속 작업 — 등록 시엔 null. */
    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    private Restaurant(String kakaoPlaceId, String name, String address, String roadAddress,
                       BigDecimal latitude, BigDecimal longitude, String kakaoCategory,
                       String phone, String placeUrl, Long createdBy) {
        this.kakaoPlaceId = kakaoPlaceId;
        this.name = name;
        this.address = address;
        this.roadAddress = roadAddress;
        this.latitude = latitude;
        this.longitude = longitude;
        this.kakaoCategory = kakaoCategory;
        this.phone = phone;
        this.placeUrl = placeUrl;
        this.status = RestaurantStatus.ACTIVE;
        this.category = "TONKATSU";
        this.voteCount = 0;
        this.createdBy = createdBy;
    }

    /**
     * 카카오 검색 결과로 가게를 ACTIVE 로 등록한다.
     * 카테고리 화이트리스트 검증은 호출 전 서비스 계층에서 끝난 상태여야 한다.
     */
    public static Restaurant register(String kakaoPlaceId, String name, String address, String roadAddress,
                                      BigDecimal latitude, BigDecimal longitude, String kakaoCategory,
                                      String phone, String placeUrl, Long createdBy) {
        return new Restaurant(kakaoPlaceId, name, address, roadAddress, latitude, longitude,
                kakaoCategory, phone, placeUrl, createdBy);
    }

    /** 투표 1표 유입 — vote_count +1. (투표 도메인 트랜잭션 안에서만 호출) */
    public void increaseVoteCount() {
        this.voteCount++;
    }

    /** 표 이탈 — vote_count -1. 0 미만이면 정합성 오류이므로 즉시 실패한다. */
    public void decreaseVoteCount() {
        if (this.voteCount <= 0) {
            throw new IllegalStateException("vote_count가 이미 0입니다. restaurantId=" + this.id);
        }
        this.voteCount--;
    }

    /** ACTIVE 만 투표 가능(폐업·이전·심사중·거부는 불가). */
    public boolean isVotable() {
        return this.status == RestaurantStatus.ACTIVE;
    }

    /** 폐업 처리(박제) — 표·히스토리는 보존하되 투표·랭킹에서 제외된다. (감지는 운영자 수동) */
    public void close() {
        this.status = RestaurantStatus.CLOSED;
        this.closedAt = Instant.now();
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
