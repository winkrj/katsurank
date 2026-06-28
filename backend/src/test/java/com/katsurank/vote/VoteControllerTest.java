package com.katsurank.vote;

import com.katsurank.restaurant.Restaurant;
import com.katsurank.restaurant.RestaurantRepository;
import com.katsurank.support.CleanUp;
import com.katsurank.support.TestAuth;
import com.katsurank.support.TestFixtures;
import com.katsurank.support.WithMockAuthPrincipal;
import com.katsurank.user.User;
import com.katsurank.user.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Sql(statements = {CleanUp.SQL_CLEAR_VOTES, CleanUp.SQL_DELETE_VOTES, CleanUp.SQL_DELETE_RESTAURANTS})
class VoteControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired RestaurantRepository restaurantRepository;
    @Autowired UserRepository userRepository;

    @Test
    @DisplayName("POST /api/v1/votes — 미인증 → 401")
    void voteWithoutAuth() throws Exception {
        mockMvc.perform(post("/api/v1/votes")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"restaurantId": 1}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/v1/votes — CSRF 토큰 없이 → 403")
    @WithMockAuthPrincipal
    void voteWithoutCsrf() throws Exception {
        mockMvc.perform(post("/api/v1/votes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"restaurantId": 1}
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/v1/votes — 인증 + CSRF → 정상 투표")
    void voteSuccess() throws Exception {
        User user = userRepository.save(User.register(100L, "테스터", null));
        Restaurant r = TestFixtures.createRestaurant(restaurantRepository);

        mockMvc.perform(post("/api/v1/votes")
                        .with(csrf())
                        .with(TestAuth.oauth2(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"restaurantId": %d}
                                """.formatted(r.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.restaurantId").value(r.getId()))
                .andExpect(jsonPath("$.voteCount").value(1));
    }

    @Test
    @DisplayName("POST /api/v1/votes — restaurantId 누락 → 400")
    void voteValidationError() throws Exception {
        User user = userRepository.save(User.register(101L, "테스터2", null));

        mockMvc.perform(post("/api/v1/votes")
                        .with(csrf())
                        .with(TestAuth.oauth2(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("POST /api/v1/votes — 존재하지 않는 가게 → 404")
    void voteRestaurantNotFound() throws Exception {
        User user = userRepository.save(User.register(200L, "테스터3", null));

        mockMvc.perform(post("/api/v1/votes")
                        .with(csrf())
                        .with(TestAuth.oauth2(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"restaurantId": 999999}
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("RESTAURANT_NOT_FOUND"));
    }
}
