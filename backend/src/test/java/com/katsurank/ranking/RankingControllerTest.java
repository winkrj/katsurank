package com.katsurank.ranking;

import com.katsurank.restaurant.repository.RestaurantRepository;
import com.katsurank.support.CleanUp;
import com.katsurank.support.TestFixtures;
import com.katsurank.user.User;
import com.katsurank.user.repository.UserRepository;
import com.katsurank.vote.service.VoteService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Sql(statements = {CleanUp.SQL_CLEAR_VOTES, CleanUp.SQL_DELETE_VOTES, CleanUp.SQL_DELETE_RESTAURANTS})
class RankingControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired RestaurantRepository restaurantRepository;
    @Autowired UserRepository userRepository;
    @Autowired VoteService voteService;

    @Test
    @DisplayName("GET /api/v1/ranking — 인증 없이 200 + 랭킹 응답")
    void rankingWithoutAuth() throws Exception {
        var r = TestFixtures.createRestaurant(restaurantRepository, "돈까스왕");
        User user = TestFixtures.createUser(userRepository);
        voteService.vote(user.getId(), r.getId());

        mockMvc.perform(get("/api/v1/ranking"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.items[0].name").value("돈까스왕"))
                .andExpect(jsonPath("$.data.items[0].rank").value(1))
                .andExpect(jsonPath("$.data.total").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/ranking?limit=0 → 400")
    void rankingInvalidLimit() throws Exception {
        mockMvc.perform(get("/api/v1/ranking").param("limit", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("LIMIT_EXCEEDED"));
    }

    @Test
    @DisplayName("GET /api/v1/ranking/top — 데이터 없으면 204")
    void topEmpty() throws Exception {
        mockMvc.perform(get("/api/v1/ranking/top"))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("GET /api/v1/ranking/top — 데이터 있으면 200 + 1위")
    void topWithData() throws Exception {
        var r = TestFixtures.createRestaurant(restaurantRepository, "왕좌돈까스");
        User user = TestFixtures.createUser(userRepository);
        voteService.vote(user.getId(), r.getId());

        mockMvc.perform(get("/api/v1/ranking/top"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("왕좌돈까스"))
                .andExpect(jsonPath("$.data.rank").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/ranking/map-pins — 인증 없이 200")
    void mapPinsWithoutAuth() throws Exception {
        TestFixtures.createRestaurant(restaurantRepository, "지도핀돈까스");

        mockMvc.perform(get("/api/v1/ranking/map-pins"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("지도핀돈까스"))
                .andExpect(jsonPath("$.data[0].rank").value(1));
    }
}
