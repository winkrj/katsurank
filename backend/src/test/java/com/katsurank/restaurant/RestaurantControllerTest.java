package com.katsurank.restaurant;

import com.katsurank.restaurant.repository.RestaurantRepository;

import com.katsurank.support.CleanUp;
import com.katsurank.support.TestAuth;
import com.katsurank.support.TestFixtures;
import com.katsurank.user.User;
import com.katsurank.user.repository.UserRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Sql(statements = {CleanUp.SQL_CLEAR_VOTES, CleanUp.SQL_DELETE_VOTES, CleanUp.SQL_DELETE_RESTAURANTS})
class RestaurantControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired RestaurantRepository restaurantRepository;
    @Autowired UserRepository userRepository;

    // --- GET (공개) ---

    @Test
    @DisplayName("GET /api/v1/restaurants/{id} — 인증 없이 200")
    void getById() throws Exception {
        var r = TestFixtures.createRestaurant(restaurantRepository, "테스트돈까스");

        mockMvc.perform(get("/api/v1/restaurants/{id}", r.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("테스트돈까스"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("GET /api/v1/restaurants/{id} — 존재하지 않으면 404")
    void getByIdNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/restaurants/{id}", 999999))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("RESTAURANT_NOT_FOUND"));
    }

    @Test
    @DisplayName("GET /api/v1/restaurants/search?q=돈까스 — 인증 없이 200")
    void searchWithoutAuth() throws Exception {
        TestFixtures.createRestaurant(restaurantRepository, "명동돈까스");

        mockMvc.perform(get("/api/v1/restaurants/search").param("q", "돈까스"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].name").value("명동돈까스"))
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.offset").value(0));
    }

    @Test
    @DisplayName("GET /api/v1/restaurants/search — q 파라미터 없으면 전체 목록 반환")
    void searchWithoutQueryReturnsAll() throws Exception {
        TestFixtures.createRestaurant(restaurantRepository, "명동돈까스");
        TestFixtures.createRestaurant(restaurantRepository, "을지경양식");

        mockMvc.perform(get("/api/v1/restaurants/search"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(2))
                .andExpect(jsonPath("$.data.total").value(2));
    }

    @Test
    @DisplayName("GET /api/v1/restaurants/search?q= — 빈 문자열도 전체 목록 반환")
    void searchEmptyQueryReturnsAll() throws Exception {
        TestFixtures.createRestaurant(restaurantRepository, "명동돈까스");

        mockMvc.perform(get("/api/v1/restaurants/search").param("q", "  "))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/restaurants/search?offset=1&limit=1 — 페이징 적용")
    void searchWithPaging() throws Exception {
        TestFixtures.createRestaurant(restaurantRepository, "가게A");
        TestFixtures.createRestaurant(restaurantRepository, "가게B");

        mockMvc.perform(get("/api/v1/restaurants/search").param("offset", "1").param("limit", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.offset").value(1))
                .andExpect(jsonPath("$.data.limit").value(1))
                .andExpect(jsonPath("$.data.total").value(2));
    }

    // --- POST (인증 필요) ---

    @Test
    @DisplayName("POST /api/v1/restaurants — 미인증 → 401")
    void registerWithoutAuth() throws Exception {
        mockMvc.perform(post("/api/v1/restaurants")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"kakaoPlaceId":"p1","name":"테스트","kakaoCategory":"음식점 > 일식 > 돈까스,우동"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/v1/restaurants — 정상 등록 → 201")
    void registerSuccess() throws Exception {
        User user = userRepository.save(User.register(300L, "등록자", null, java.time.Instant.EPOCH));

        mockMvc.perform(post("/api/v1/restaurants")
                        .with(csrf())
                        .with(TestAuth.oauth2(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "kakaoPlaceId": "register-test-1",
                                  "name": "맛있는돈까스",
                                  "address": "서울 어딘가",
                                  "roadAddress": "서울 어딘가로 1",
                                  "latitude": 37.5,
                                  "longitude": 127.0,
                                  "kakaoCategory": "음식점 > 일식 > 돈까스,우동"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("맛있는돈까스"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("POST /api/v1/restaurants — 카테고리 미달 → 422")
    void registerWrongCategory() throws Exception {
        User user = userRepository.save(User.register(301L, "등록자2", null, java.time.Instant.EPOCH));

        mockMvc.perform(post("/api/v1/restaurants")
                        .with(csrf())
                        .with(TestAuth.oauth2(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "kakaoPlaceId": "sushi-1",
                                  "name": "초밥집",
                                  "kakaoCategory": "음식점 > 일식 > 초밥,롤"
                                }
                                """))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.error.code").value("CATEGORY_NOT_ALLOWED"));
    }

    @Test
    @DisplayName("POST /api/v1/restaurants — name 누락 → 400")
    void registerValidationError() throws Exception {
        User user = userRepository.save(User.register(302L, "등록자3", null, java.time.Instant.EPOCH));

        mockMvc.perform(post("/api/v1/restaurants")
                        .with(csrf())
                        .with(TestAuth.oauth2(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"kakaoPlaceId": "p1"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }
}
