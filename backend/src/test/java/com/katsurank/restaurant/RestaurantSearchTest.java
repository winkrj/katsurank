package com.katsurank.restaurant;

import com.katsurank.common.web.PageResponse;
import com.katsurank.support.CleanUp;
import com.katsurank.support.TestFixtures;
import com.katsurank.user.User;
import com.katsurank.user.UserRepository;
import com.katsurank.vote.VoteService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
@Sql(statements = {CleanUp.SQL_CLEAR_VOTES, CleanUp.SQL_DELETE_VOTES, CleanUp.SQL_DELETE_RESTAURANTS})
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

        PageResponse<RestaurantSearchResponse> response = restaurantService.search("돈가스", 0, 20);

        assertThat(response.items()).hasSize(2);
        assertThat(response.items().get(0).id()).isEqualTo(r1.getId());
        assertThat(response.items().get(1).id()).isEqualTo(r2.getId());
        assertThat(response.total()).isEqualTo(2);
    }

    @Test
    @DisplayName("q 없으면 전체 ACTIVE 가게를 vote_count 순으로 반환")
    void searchWithoutQueryReturnsAll() {
        Restaurant r1 = newRestaurant("명동돈가스", 10);
        Restaurant r2 = newRestaurant("숨은맛집", 20);

        PageResponse<RestaurantSearchResponse> response = restaurantService.search(null, 0, 20);

        assertThat(response.items()).hasSize(2);
        assertThat(response.items().get(0).id()).isEqualTo(r2.getId());
        assertThat(response.items().get(1).id()).isEqualTo(r1.getId());
        assertThat(response.total()).isEqualTo(2);
    }

    @Test
    @DisplayName("offset/limit → 페이징 적용")
    void searchPaging() {
        Restaurant r1 = newRestaurant("가게A", 20);
        newRestaurant("가게B", 10);

        PageResponse<RestaurantSearchResponse> response = restaurantService.search(null, 0, 1);

        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).id()).isEqualTo(r1.getId());
        assertThat(response.total()).isEqualTo(2);
        assertThat(response.offset()).isZero();
        assertThat(response.limit()).isEqualTo(1);
    }

    @Test
    @DisplayName("검색 응답에 rank 포함")
    void searchResponseHasRank() {
        newRestaurant("테스트돈가스", 5);

        PageResponse<RestaurantSearchResponse> response = restaurantService.search("돈가스", 0, 20);

        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).rank()).isEqualTo(1);
    }

    @Test
    @DisplayName("CLOSED 가게는 검색에서 제외")
    void closedExcludedFromSearch() {
        Restaurant r = TestFixtures.createRestaurant(restaurantRepository, "폐업돈가스");
        r = restaurantRepository.findById(r.getId()).orElseThrow();
        r.close();
        restaurantRepository.save(r);

        PageResponse<RestaurantSearchResponse> response = restaurantService.search("돈가스", 0, 20);

        assertThat(response.items()).isEmpty();
        assertThat(response.total()).isZero();
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
        Restaurant r = TestFixtures.createRestaurant(restaurantRepository, "폐업가게");
        r = restaurantRepository.findById(r.getId()).orElseThrow();
        r.close();
        restaurantRepository.save(r);

        RestaurantResponse response = restaurantService.getById(r.getId());

        assertThat(response.rank()).isNull();
        assertThat(response.status()).isEqualTo(RestaurantStatus.CLOSED);
    }

    @Test
    @DisplayName("동점 → 같은 rank")
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
        Restaurant r = TestFixtures.createRestaurant(restaurantRepository, name);
        for (int i = 0; i < voteCount; i++) {
            User user = TestFixtures.createUser(userRepository);
            voteService.vote(user.getId(), r.getId());
        }
        return restaurantRepository.findById(r.getId()).orElseThrow();
    }
}
