package com.katsurank.ranking;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDate;

@Embeddable
@Getter
@EqualsAndHashCode
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RankingDailySnapshotId implements Serializable {

    @Column(name = "snapshot_date", nullable = false, updatable = false)
    private LocalDate snapshotDate;

    @Column(name = "restaurant_id", nullable = false, updatable = false)
    private Long restaurantId;

    public RankingDailySnapshotId(LocalDate snapshotDate, Long restaurantId) {
        this.snapshotDate = snapshotDate;
        this.restaurantId = restaurantId;
    }
}
