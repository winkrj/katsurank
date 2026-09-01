package com.katsurank.ranking;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** KST 날짜 경계에서 기록한 서울 단일 랭킹의 가게별 불변 스냅샷. */
@Entity
@Table(name = "ranking_daily_snapshots")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RankingDailySnapshot {

    @EmbeddedId
    private RankingDailySnapshotId id;

    @Column(name = "rank", nullable = false, updatable = false)
    private int rank;

    @Column(name = "vote_count", nullable = false, updatable = false)
    private int voteCount;

    @Column(name = "captured_at", nullable = false, updatable = false)
    private Instant capturedAt;
}
