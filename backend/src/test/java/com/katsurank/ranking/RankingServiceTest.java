package com.katsurank.ranking;

import com.katsurank.ranking.service.RankingService;

import com.katsurank.ranking.dto.MapPinResponse;

import com.katsurank.ranking.dto.RankingItem;
import com.katsurank.ranking.dto.TopRankingResult;

import com.katsurank.ranking.exception.LimitExceededException;

import com.katsurank.common.web.PageResponse;
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
import org.springframework.test.context.jdbc.Sql;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
@Sql(statements = {CleanUp.SQL_CLEAR_VOTES, CleanUp.SQL_DELETE_VOTES, CleanUp.SQL_DELETE_RESTAURANTS})
class RankingServiceTest {

    @Autowired RankingService rankingService;
    @Autowired VoteService voteService;
    @Autowired RestaurantRepository restaurantRepository;
    @Autowired UserRepository userRepository;

    @Test
    @DisplayName("ACTIVE 가게 3개, vote_count=[10,5,5] → rank [1,2,2] (동점은 동일 순위, 정렬은 id 순)")
    void rankingOrder() {
        Restaurant r1 = newRestaurant("가게A");
        Restaurant r2 = newRestaurant("가게B");
        Restaurant r3 = newRestaurant("가게C");

        vote(r1, 10);
        vote(r2, 5);
        vote(r3, 5);

        PageResponse<RankingItem> response = rankingService.getRanking(0, 20);

        assertThat(response.items()).hasSize(3);
        assertThat(response.items().get(0).rank()).isEqualTo(1);
        assertThat(response.items().get(0).id()).isEqualTo(r1.getId());
        assertThat(response.items().get(0).voteCount()).isEqualTo(10);
        assertThat(response.items().get(1).rank()).isEqualTo(2);
        assertThat(response.items().get(1).id()).isEqualTo(r2.getId());
        assertThat(response.items().get(2).rank()).isEqualTo(2);
        assertThat(response.items().get(2).id()).isEqualTo(r3.getId());
        assertThat(response.total()).isEqualTo(3);
    }

    @Test
    @DisplayName("CLOSED 가게는 랭킹에서 제외")
    void closedExcluded() {
        Restaurant active = newRestaurant("활성가게");
        Restaurant closed = newRestaurant("폐업가게");
        vote(active, 3);
        vote(closed, 5);

        closed = restaurantRepository.findById(closed.getId()).orElseThrow();
        closed.close(java.time.Instant.EPOCH);
        restaurantRepository.save(closed);

        PageResponse<RankingItem> response = rankingService.getRanking(0, 20);

        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).id()).isEqualTo(active.getId());
        assertThat(response.total()).isEqualTo(1);
    }

    @Test
    @DisplayName("limit=101 → LimitExceededException")
    void limitExceeded() {
        assertThatThrownBy(() -> rankingService.getRanking(0, 101))
                .isInstanceOf(LimitExceededException.class);
    }

    @Test
    @DisplayName("ACTIVE 가게 0개 → top empty, ranking items=[]")
    void emptyRanking() {
        PageResponse<RankingItem> response = rankingService.getRanking(0, 20);
        assertThat(response.items()).isEmpty();
        assertThat(response.total()).isZero();

        assertThat(rankingService.getTop()).isInstanceOf(TopRankingResult.Empty.class);
    }

    @Test
    @DisplayName("offset=2, limit=1 → rank=3")
    void offsetReflectedInRank() {
        Restaurant r1 = newRestaurant("가게1");
        Restaurant r2 = newRestaurant("가게2");
        Restaurant r3 = newRestaurant("가게3");
        vote(r1, 10);
        vote(r2, 5);
        vote(r3, 3);

        PageResponse<RankingItem> response = rankingService.getRanking(2, 1);

        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).rank()).isEqualTo(3);
        assertThat(response.items().get(0).id()).isEqualTo(r3.getId());
        assertThat(response.total()).isEqualTo(3);
    }

    @Test
    @DisplayName("동점 그룹 중간 offset도 원래 순위를 유지")
    void offsetInsideTieKeepsOriginalRank() {
        Restaurant r1 = newRestaurant("가게1");
        Restaurant r2 = newRestaurant("가게2");
        Restaurant r3 = newRestaurant("가게3");
        vote(r1, 10);
        vote(r2, 5);
        vote(r3, 5);

        PageResponse<RankingItem> response = rankingService.getRanking(2, 1);

        assertThat(response.items()).singleElement().satisfies(item -> {
            assertThat(item.id()).isEqualTo(r3.getId());
            assertThat(item.rank()).isEqualTo(2);
        });
    }

    @Test
    @DisplayName("top → 1위 가게 반환")
    void topReturnsFirst() {
        Restaurant r1 = newRestaurant("1위가게");
        Restaurant r2 = newRestaurant("2위가게");
        vote(r1, 10);
        vote(r2, 5);

        TopRankingResult result = rankingService.getTop();

        assertThat(result).isInstanceOfSatisfying(TopRankingResult.Found.class, found -> {
            assertThat(found.item().rank()).isEqualTo(1);
            assertThat(found.item().id()).isEqualTo(r1.getId());
        });
    }

    @Test
    @DisplayName("지도 핀 — 좌표 없는 가게 제외, CLOSED 제외")
    void mapPinsExcludeNullCoordsAndClosed() {
        Restaurant withCoords = newRestaurant("좌표있음");
        TestFixtures.createRestaurantNoCoords(restaurantRepository, "좌표없음");

        Restaurant closedWithCoords = newRestaurant("폐업좌표있음");
        closedWithCoords = restaurantRepository.findById(closedWithCoords.getId()).orElseThrow();
        closedWithCoords.close(java.time.Instant.EPOCH);
        restaurantRepository.save(closedWithCoords);

        List<MapPinResponse> pins = rankingService.getMapPins();

        assertThat(pins).hasSize(1);
        assertThat(pins.get(0).id()).isEqualTo(withCoords.getId());
        assertThat(pins.get(0).rank()).isEqualTo(1);
    }

    @Test
    @DisplayName("지도 핀 순위는 좌표 없는 ACTIVE 가게를 포함한 서울 전체 순위이며 동점은 같은 순위")
    void mapPinsUseGlobalRankIncludingRestaurantsWithoutCoordinates() {
        Restaurant first = newRestaurant("1위 핀");
        Restaurant tiedPin = newRestaurant("공동 2위 핀");
        Restaurant tiedWithoutCoords = TestFixtures.createRestaurantNoCoords(restaurantRepository, "공동 2위 좌표 없음");
        Restaurant fourth = newRestaurant("4위 핀");

        vote(first, 10);
        vote(tiedPin, 5);
        vote(tiedWithoutCoords, 5);
        vote(fourth, 3);

        List<MapPinResponse> pins = rankingService.getMapPins();

        assertThat(pins).extracting(MapPinResponse::id)
                .containsExactly(first.getId(), tiedPin.getId(), fourth.getId());
        assertThat(pins).extracting(MapPinResponse::rank)
                .containsExactly(1, 2, 4);
    }

    // --- helpers ---

    private void vote(Restaurant restaurant, int count) {
        for (int i = 0; i < count; i++) {
            User user = TestFixtures.createUser(userRepository);
            voteService.vote(user.getId(), restaurant.getId());
        }
    }

    private Restaurant newRestaurant(String name) {
        return TestFixtures.createRestaurant(restaurantRepository, name);
    }
}
