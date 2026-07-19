package com.katsurank.me;

import com.katsurank.restaurant.Restaurant;
import com.katsurank.restaurant.repository.RestaurantRepository;
import com.katsurank.support.CleanUp;
import com.katsurank.support.TestAuth;
import com.katsurank.support.TestFixtures;
import com.katsurank.user.User;
import com.katsurank.user.repository.UserRepository;
import com.katsurank.vote.service.VoteService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
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
class MeControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired RestaurantRepository restaurantRepository;
    @Autowired UserRepository userRepository;
    @Autowired VoteService voteService;

    @Test
    @DisplayName("GET /api/v1/me — 미인증 → 401")
    void meWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/v1/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v1/me — 투표 없는 유저 → currentVote: null")
    void meNoVote() throws Exception {
        User user = userRepository.save(User.register(400L, "신규유저", null, java.time.Instant.EPOCH));

        mockMvc.perform(get("/api/v1/me").with(TestAuth.oauth2(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nickname").value("신규유저"))
                .andExpect(jsonPath("$.data.currentVote").isEmpty());
    }

    @Test
    @DisplayName("GET /api/v1/me — 투표 후 → currentVote 포함")
    void meWithVote() throws Exception {
        User user = userRepository.save(User.register(401L, "투표유저", null, java.time.Instant.EPOCH));
        Restaurant r = TestFixtures.createRestaurant(restaurantRepository, "내가게");
        voteService.vote(user.getId(), r.getId());

        mockMvc.perform(get("/api/v1/me").with(TestAuth.oauth2(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentVote.restaurantName").value("내가게"))
                .andExpect(jsonPath("$.data.currentVote.rank").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/me/vote-history — 미인증 → 401")
    void historyWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/v1/me/vote-history"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v1/me/vote-history — 표 이동 후 히스토리 2건")
    void historyAfterMove() throws Exception {
        User user = userRepository.save(User.register(402L, "이동유저", null, java.time.Instant.EPOCH));
        Restaurant a = TestFixtures.createRestaurant(restaurantRepository, "가게A");
        Restaurant b = TestFixtures.createRestaurant(restaurantRepository, "가게B");
        voteService.vote(user.getId(), a.getId());
        voteService.vote(user.getId(), b.getId());

        mockMvc.perform(get("/api/v1/me/vote-history").with(TestAuth.oauth2(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(2))
                .andExpect(jsonPath("$.data.total").value(2))
                .andExpect(jsonPath("$.data.items[0].restaurantName").value("가게B"))
                .andExpect(jsonPath("$.data.items[0].isCurrent").value(true))
                .andExpect(jsonPath("$.data.items[1].restaurantName").value("가게A"))
                .andExpect(jsonPath("$.data.items[1].isCurrent").value(false));
    }
}
