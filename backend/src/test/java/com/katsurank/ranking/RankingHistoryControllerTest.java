package com.katsurank.ranking;

import com.katsurank.restaurant.Restaurant;
import com.katsurank.restaurant.repository.RestaurantRepository;
import com.katsurank.support.CleanUp;
import com.katsurank.support.TestFixtures;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Sql(statements = {
        CleanUp.SQL_DELETE_COMMENTS,
        CleanUp.SQL_DELETE_RANKING_SNAPSHOTS,
        CleanUp.SQL_DELETE_RANKING_SNAPSHOT_RUNS,
        CleanUp.SQL_CLEAR_VOTES,
        CleanUp.SQL_DELETE_VOTES,
        CleanUp.SQL_DELETE_RESTAURANTS
})
class RankingHistoryControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired RestaurantRepository restaurantRepository;
    @Autowired JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("가게 순위 히스토리는 인증 없이 날짜 오름차순으로 조회한다")
    void historyWithoutAuthentication() throws Exception {
        Restaurant restaurant = TestFixtures.createRestaurant(restaurantRepository);
        insertSnapshot(restaurant.getId(), LocalDate.of(2026, 8, 31), 4, 5);
        insertSnapshot(restaurant.getId(), LocalDate.of(2026, 9, 1), 2, 7);

        mockMvc.perform(get("/api/v1/restaurants/{restaurantId}/ranking-history", restaurant.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].date").value("2026-08-31"))
                .andExpect(jsonPath("$.data[0].rank").value(4))
                .andExpect(jsonPath("$.data[1].date").value("2026-09-01"))
                .andExpect(jsonPath("$.data[1].voteCount").value(7));
    }

    @Test
    @DisplayName("히스토리가 없는 가게는 빈 배열을 반환한다")
    void emptyHistory() throws Exception {
        Restaurant restaurant = TestFixtures.createRestaurant(restaurantRepository);

        mockMvc.perform(get("/api/v1/restaurants/{restaurantId}/ranking-history", restaurant.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    @DisplayName("존재하지 않는 가게 히스토리는 404다")
    void missingRestaurant() throws Exception {
        mockMvc.perform(get("/api/v1/restaurants/{restaurantId}/ranking-history", 999999))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("RESTAURANT_NOT_FOUND"));
    }

    private void insertSnapshot(Long restaurantId, LocalDate date, int rank, int voteCount) {
        jdbcTemplate.update("""
                        INSERT INTO ranking_daily_snapshots
                            (snapshot_date, restaurant_id, rank, vote_count, captured_at)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                date, restaurantId, rank, voteCount, Timestamp.from(Instant.parse("2026-09-01T00:00:00Z")));
    }
}
