package com.katsurank.restaurant;

import com.katsurank.user.User;
import com.katsurank.user.UserRepository;
import com.katsurank.vote.VoteService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
@Sql(statements = {
        "UPDATE users SET current_vote_id = NULL",
        "DELETE FROM votes",
        "DELETE FROM restaurants",
})
class RestaurantSearchTest {

    @Autowired RestaurantService restaurantService;
    @Autowired RestaurantRepository restaurantRepository;
    @Autowired UserRepository userRepository;
    @Autowired VoteService voteService;

    @Test
    @DisplayName("q=돈가스 → 이름에 '돈가스' 포함된 ACTIVE 가게만, vote_count 순")
    void searchByName() {
        Restaurant r1 = newRestaurant("명동돈가스", 10);
        Restaurant r2 = newRestaurant("을지돈가스", 5);
        newRestaurant("숨은맛집", 20);

        List<RestaurantSearchResponse> results = restaurantService.search("돈가스", 20);

        assertThat(results).hasSize(2);
        assertThat(results.get(0).id()).isEqualTo(r1.getId());
        assertThat(results.get(1).id()).isEqualTo(r2.getId());
    }

    @Test
    @DisplayName("검색 응답에 status 필드 없음 + rank 포함")
    void searchResponseHasRankNoStatus() {
        newRestaurant("테스트돈가스", 5);

        List<RestaurantSearchResponse> results = restaurantService.search("돈가스", 20);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).rank()).isEqualTo(1);
    }

    @Test
    @DisplayName("CLOSED 가게는 검색에서 제외")
    void closedExcludedFromSearch() {
        Restaurant r = newRestaurant("폐업돈가스", 0);
        r = restaurantRepository.findById(r.getId()).orElseThrow();
        r.close();
        restaurantRepository.save(r);

        List<RestaurantSearchResponse> results = restaurantService.search("돈가스", 20);

        assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("상세 조회 — ACTIVE 가게에 rank 포함")
    void getByIdWithRank() {
        Restaurant top = newRestaurant("1위가게", 10);
        newRestaurant("2위가게", 5);

        RestaurantResponse response = restaurantService.getById(top.getId());

        assertThat(response.rank()).isEqualTo(1L);
    }

    @Test
    @DisplayName("상세 조회 — CLOSED 가게는 rank=null")
    void getByIdClosedHasNullRank() {
        Restaurant r = newRestaurant("폐업가게", 0);
        r = restaurantRepository.findById(r.getId()).orElseThrow();
        r.close();
        restaurantRepository.save(r);

        RestaurantResponse response = restaurantService.getById(r.getId());

        assertThat(response.rank()).isNull();
        assertThat(response.status()).isEqualTo(RestaurantStatus.CLOSED);
    }

    @Test
    @DisplayName("동점 → 같은 rank (집계 기반)")
    void sameVoteCountSameRank() {
        Restaurant r1 = newRestaurant("가게A", 5);
        Restaurant r2 = newRestaurant("가게B", 5);

        RestaurantResponse resp1 = restaurantService.getById(r1.getId());
        RestaurantResponse resp2 = restaurantService.getById(r2.getId());

        assertThat(resp1.rank()).isEqualTo(resp2.rank());
    }

    @Test
    @DisplayName("rank = (vote_count 초과 ACTIVE 가게 수) + 1")
    void rankCalculation() {
        newRestaurant("상위가게", 20);
        newRestaurant("상위가게2", 15);
        Restaurant target = newRestaurant("대상가게", 10);

        RestaurantResponse response = restaurantService.getById(target.getId());

        assertThat(response.rank()).isEqualTo(3L);
    }

    // --- helpers ---

    private Restaurant newRestaurant(String name, int voteCount) {
        Restaurant r = restaurantRepository.save(Restaurant.register(
                "test-" + UUID.randomUUID(), name, "서울 어딘가", "서울 어딘가로 1",
                new BigDecimal("37.5000000"), new BigDecimal("127.0000000"),
                "음식점 > 일식 > 돈까스,우동", null, "https://place.map.kakao.com/test", null));
        for (int i = 0; i < voteCount; i++) {
            User user = newUser();
            voteService.vote(user.getId(), r.getId());
        }
        return restaurantRepository.findById(r.getId()).orElseThrow();
    }

    private User newUser() {
        long kakaoId = ThreadLocalRandom.current().nextLong(1, Long.MAX_VALUE);
        return userRepository.save(User.register(kakaoId, "tester-" + kakaoId, null));
    }
}
