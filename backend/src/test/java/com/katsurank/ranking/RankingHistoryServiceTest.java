package com.katsurank.ranking;

import com.katsurank.ranking.repository.RankingHistoryRepository;
import com.katsurank.ranking.exception.RankingRestaurantNotFoundException;
import com.katsurank.ranking.service.RankingHistoryService;
import com.katsurank.restaurant.Restaurant;
import com.katsurank.restaurant.repository.RestaurantRepository;
import com.katsurank.support.CleanUp;
import com.katsurank.support.TestFixtures;
import com.katsurank.user.User;
import com.katsurank.user.repository.UserRepository;
import com.katsurank.vote.service.VoteService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.sql.Timestamp;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Import(RankingHistoryServiceTest.FixedClockConfig.class)
@Transactional
@Sql(statements = {
        CleanUp.SQL_DELETE_COMMENTS,
        CleanUp.SQL_DELETE_RANKING_SNAPSHOTS,
        CleanUp.SQL_DELETE_RANKING_SNAPSHOT_RUNS,
        CleanUp.SQL_CLEAR_VOTES,
        CleanUp.SQL_DELETE_VOTES,
        CleanUp.SQL_DELETE_RESTAURANTS
})
class RankingHistoryServiceTest {

    private static final Instant FIXED_NOW = Instant.parse("2026-09-01T15:30:00Z");

    @Autowired RankingHistoryService rankingHistoryService;
    @Autowired RankingHistoryRepository rankingHistoryRepository;
    @Autowired RestaurantRepository restaurantRepository;
    @Autowired UserRepository userRepository;
    @Autowired VoteService voteService;
    @Autowired JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("KST 날짜에 ACTIVE 전체를 좌표와 무관하게 경쟁 순위로 저장하고 재실행은 멱등이다")
    void captureDailySnapshot() {
        Restaurant first = TestFixtures.createRestaurant(restaurantRepository, "1위");
        Restaurant tied = TestFixtures.createRestaurant(restaurantRepository, "공동2위");
        Restaurant tiedWithoutCoordinates = TestFixtures.createRestaurantNoCoords(restaurantRepository, "좌표없는공동2위");
        Restaurant fourth = TestFixtures.createRestaurant(restaurantRepository, "4위");
        Restaurant closed = TestFixtures.createClosedRestaurant(restaurantRepository, "폐업");
        vote(first, 10);
        vote(tied, 5);
        vote(tiedWithoutCoordinates, 5);
        vote(fourth, 3);

        assertThat(rankingHistoryService.captureDailySnapshot()).isEqualTo(4);

        Restaurant registeredAfterCapture = TestFixtures.createRestaurant(restaurantRepository, "자정 이후 등록");
        assertThat(rankingHistoryService.captureDailySnapshot()).isZero();

        assertSnapshot(first, 1, 10);
        assertSnapshot(tied, 2, 5);
        assertSnapshot(tiedWithoutCoordinates, 2, 5);
        assertSnapshot(fourth, 4, 3);
        assertThat(rankingHistoryRepository.findTop7ByIdRestaurantIdOrderByIdSnapshotDateDesc(closed.getId()))
                .isEmpty();
        assertThat(rankingHistoryRepository.findTop7ByIdRestaurantIdOrderByIdSnapshotDateDesc(
                registeredAfterCapture.getId())).isEmpty();
    }

    @Test
    @DisplayName("ACTIVE 가게가 없는 최초 실행도 날짜 완료로 기록해 같은 날 재실행을 막는다")
    void emptyCaptureStillClaimsDate() {
        assertThat(rankingHistoryService.captureDailySnapshot()).isZero();

        Restaurant registeredAfterCapture = TestFixtures.createRestaurant(restaurantRepository, "자정 이후 등록");
        assertThat(rankingHistoryService.captureDailySnapshot()).isZero();

        assertThat(rankingHistoryRepository.findTop7ByIdRestaurantIdOrderByIdSnapshotDateDesc(
                registeredAfterCapture.getId())).isEmpty();
        Integer runs = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM ranking_daily_snapshot_runs WHERE snapshot_date = ?",
                Integer.class,
                LocalDate.of(2026, 9, 2));
        assertThat(runs).isEqualTo(1);
    }

    @Test
    @DisplayName("최근 실제 스냅샷 7건만 날짜 오름차순으로 반환한다")
    void getSevenMostRecentSnapshotsAscending() {
        Restaurant restaurant = TestFixtures.createRestaurant(restaurantRepository);
        for (int day = 1; day <= 9; day++) {
            insertSnapshot(LocalDate.of(2026, 8, 23).plusDays(day), restaurant.getId(), day, day * 2);
        }

        var history = rankingHistoryService.getHistory(restaurant.getId());

        assertThat(history).hasSize(7);
        assertThat(history).extracting(item -> item.date())
                .containsExactly(
                        LocalDate.of(2026, 8, 26),
                        LocalDate.of(2026, 8, 27),
                        LocalDate.of(2026, 8, 28),
                        LocalDate.of(2026, 8, 29),
                        LocalDate.of(2026, 8, 30),
                        LocalDate.of(2026, 8, 31),
                        LocalDate.of(2026, 9, 1));
    }

    @Test
    @DisplayName("폐업 후에도 기존 히스토리를 반환하고 히스토리가 없으면 빈 목록이다")
    void retainedHistoryAndEmptyHistory() {
        Restaurant restaurant = TestFixtures.createRestaurant(restaurantRepository);
        insertSnapshot(LocalDate.of(2026, 9, 1), restaurant.getId(), 3, 7);
        restaurant.close(FIXED_NOW);
        restaurantRepository.saveAndFlush(restaurant);

        assertThat(rankingHistoryService.getHistory(restaurant.getId())).singleElement().satisfies(item -> {
            assertThat(item.rank()).isEqualTo(3);
            assertThat(item.voteCount()).isEqualTo(7);
        });

        Restaurant withoutHistory = TestFixtures.createRestaurant(restaurantRepository);
        assertThat(rankingHistoryService.getHistory(withoutHistory.getId())).isEmpty();
    }

    @Test
    @DisplayName("존재하지 않는 가게 히스토리는 404 도메인 예외다")
    void missingRestaurant() {
        assertThatThrownBy(() -> rankingHistoryService.getHistory(999999L))
                .isInstanceOf(RankingRestaurantNotFoundException.class);
    }

    private void assertSnapshot(Restaurant restaurant, int expectedRank, int expectedVoteCount) {
        assertThat(rankingHistoryRepository.findTop7ByIdRestaurantIdOrderByIdSnapshotDateDesc(restaurant.getId()))
                .singleElement().satisfies(snapshot -> {
                    assertThat(snapshot.getId().getSnapshotDate()).isEqualTo(LocalDate.of(2026, 9, 2));
                    assertThat(snapshot.getRank()).isEqualTo(expectedRank);
                    assertThat(snapshot.getVoteCount()).isEqualTo(expectedVoteCount);
                    assertThat(snapshot.getCapturedAt()).isEqualTo(FIXED_NOW);
                });
    }

    private void vote(Restaurant restaurant, int count) {
        for (int i = 0; i < count; i++) {
            User user = TestFixtures.createUser(userRepository);
            voteService.vote(user.getId(), restaurant.getId());
        }
    }

    private void insertSnapshot(LocalDate date, Long restaurantId, int rank, int voteCount) {
        jdbcTemplate.update("""
                        INSERT INTO ranking_daily_snapshots
                            (snapshot_date, restaurant_id, rank, vote_count, captured_at)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                date, restaurantId, rank, voteCount, Timestamp.from(FIXED_NOW));
    }

    @TestConfiguration
    static class FixedClockConfig {

        @Bean
        @Primary
        Clock testClock() {
            return Clock.fixed(FIXED_NOW, ZoneOffset.UTC);
        }
    }
}
