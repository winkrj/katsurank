package com.katsurank.ranking.repository;

import com.katsurank.ranking.RankingDailySnapshot;
import com.katsurank.ranking.RankingDailySnapshotId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public interface RankingHistoryRepository
        extends JpaRepository<RankingDailySnapshot, RankingDailySnapshotId> {

    List<RankingDailySnapshot> findTop7ByIdRestaurantIdOrderByIdSnapshotDateDesc(Long restaurantId);

    @Query(value = "SELECT EXISTS (SELECT 1 FROM restaurants WHERE id = :restaurantId)", nativeQuery = true)
    boolean restaurantExists(@Param("restaurantId") Long restaurantId);

    @Modifying
    @Query(value = """
            WITH claimed_run AS (
                INSERT INTO ranking_daily_snapshot_runs (snapshot_date, captured_at)
                VALUES (:snapshotDate, :capturedAt)
                ON CONFLICT (snapshot_date) DO NOTHING
                RETURNING snapshot_date
            ),
            ranked AS (
                SELECT id AS restaurant_id,
                       CAST(RANK() OVER (ORDER BY vote_count DESC) AS INTEGER) AS rank,
                       vote_count
                FROM restaurants
                WHERE status = 'ACTIVE'
            )
            INSERT INTO ranking_daily_snapshots
                (snapshot_date, restaurant_id, rank, vote_count, captured_at)
            SELECT claimed_run.snapshot_date,
                   ranked.restaurant_id,
                   ranked.rank,
                   ranked.vote_count,
                   :capturedAt
            FROM claimed_run
            CROSS JOIN ranked
            ON CONFLICT (snapshot_date, restaurant_id) DO NOTHING
            """, nativeQuery = true)
    int captureDailySnapshot(@Param("snapshotDate") LocalDate snapshotDate,
                             @Param("capturedAt") Instant capturedAt);
}
