package com.katsurank.comment;

import com.katsurank.comment.service.CommentService;
import com.katsurank.comment.repository.CommentRepository;
import com.katsurank.restaurant.Restaurant;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Sql(statements = {
        CleanUp.SQL_DELETE_COMMENTS,
        CleanUp.SQL_DELETE_RANKING_SNAPSHOTS,
        CleanUp.SQL_CLEAR_VOTES,
        CleanUp.SQL_DELETE_VOTES,
        CleanUp.SQL_DELETE_RESTAURANTS
})
class CommentControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired CommentService commentService;
    @Autowired CommentRepository commentRepository;
    @Autowired RestaurantRepository restaurantRepository;
    @Autowired UserRepository userRepository;

    @Test
    @DisplayName("댓글 목록은 인증 없이 조회할 수 있다")
    void listWithoutAuthentication() throws Exception {
        Restaurant restaurant = TestFixtures.createRestaurant(restaurantRepository);
        User user = TestFixtures.createUser(userRepository);
        commentService.create(restaurant.getId(), user.getId(), "공개 댓글");

        mockMvc.perform(get("/api/v1/restaurants/{restaurantId}/comments", restaurant.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].content").value("공개 댓글"))
                .andExpect(jsonPath("$.data.items[0].author.id").value(user.getId()))
                .andExpect(jsonPath("$.data.total").value(1));
    }

    @Test
    @DisplayName("존재하지 않는 가게의 댓글 목록은 404다")
    void listMissingRestaurant() throws Exception {
        mockMvc.perform(get("/api/v1/restaurants/{restaurantId}/comments", 999999))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("RESTAURANT_NOT_FOUND"));
    }

    @Test
    @DisplayName("미인증 댓글 작성은 401이다")
    void createWithoutAuthentication() throws Exception {
        Restaurant restaurant = TestFixtures.createRestaurant(restaurantRepository);

        mockMvc.perform(post("/api/v1/restaurants/{restaurantId}/comments", restaurant.getId())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"댓글\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("CSRF 토큰 없는 댓글 작성은 403이다")
    void createWithoutCsrf() throws Exception {
        Restaurant restaurant = TestFixtures.createRestaurant(restaurantRepository);
        User user = TestFixtures.createUser(userRepository);

        mockMvc.perform(post("/api/v1/restaurants/{restaurantId}/comments", restaurant.getId())
                        .with(TestAuth.oauth2(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"댓글\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("로그인 사용자는 댓글을 작성하고 수정하고 삭제할 수 있다")
    void commentCrud() throws Exception {
        Restaurant restaurant = TestFixtures.createRestaurant(restaurantRepository);
        User user = TestFixtures.createUser(userRepository);

        mockMvc.perform(post("/api/v1/restaurants/{restaurantId}/comments", restaurant.getId())
                        .with(csrf())
                        .with(TestAuth.oauth2(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"  작성 내용  \"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.content").value("작성 내용"));

        Long commentId = commentRepository.findByRestaurantIdAndUserId(restaurant.getId(), user.getId())
                .orElseThrow().getId();

        mockMvc.perform(patch("/api/v1/restaurants/{restaurantId}/comments/{commentId}",
                        restaurant.getId(), commentId)
                        .with(csrf())
                        .with(TestAuth.oauth2(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"수정 내용\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").value("수정 내용"));

        mockMvc.perform(delete("/api/v1/restaurants/{restaurantId}/comments/{commentId}",
                        restaurant.getId(), commentId)
                        .with(csrf())
                        .with(TestAuth.oauth2(user)))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));
    }

    @Test
    @DisplayName("공백 댓글은 공통 검증 오류를 반환한다")
    void rejectBlankContent() throws Exception {
        Restaurant restaurant = TestFixtures.createRestaurant(restaurantRepository);
        User user = TestFixtures.createUser(userRepository);

        mockMvc.perform(post("/api/v1/restaurants/{restaurantId}/comments", restaurant.getId())
                        .with(csrf())
                        .with(TestAuth.oauth2(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("다른 사용자의 댓글 수정은 403 COMMENT_FORBIDDEN이다")
    void rejectUpdateByNonOwner() throws Exception {
        Restaurant restaurant = TestFixtures.createRestaurant(restaurantRepository);
        User owner = TestFixtures.createUser(userRepository);
        User other = TestFixtures.createUser(userRepository);
        var comment = commentService.create(restaurant.getId(), owner.getId(), "원문");

        mockMvc.perform(patch("/api/v1/restaurants/{restaurantId}/comments/{commentId}",
                        restaurant.getId(), comment.id())
                        .with(csrf())
                        .with(TestAuth.oauth2(other))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"가로채기\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("COMMENT_FORBIDDEN"));
    }
}
