package com.katsurank.restaurant;

import com.katsurank.support.CleanUp;
import com.katsurank.support.TestFixtures;
import com.katsurank.user.User;
import com.katsurank.user.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
@Sql(statements = {CleanUp.SQL_CLEAR_VOTES, CleanUp.SQL_DELETE_VOTES, CleanUp.SQL_DELETE_RESTAURANTS})
class RestaurantServiceTest {

    @Autowired RestaurantService restaurantService;
    @Autowired RestaurantRepository restaurantRepository;
    @Autowired UserRepository userRepository;

    @Test
    @DisplayName("정상 등록 — ACTIVE 상태, voteCount=0")
    void registerSuccess() {
        User user = TestFixtures.createUser(userRepository);
        RestaurantRegisterRequest request = tonkatsuRequest("test-place-1", "맛있는돈까스");

        RestaurantResponse response = restaurantService.register(request, user.getId());

        assertThat(response.id()).isNotNull();
        assertThat(response.name()).isEqualTo("맛있는돈까스");
        assertThat(response.status()).isEqualTo(RestaurantStatus.ACTIVE);
        assertThat(response.voteCount()).isZero();
        assertThat(response.category()).isEqualTo("TONKATSU");
    }

    @Test
    @DisplayName("같은 kakaoPlaceId 중복 등록 → DuplicatePlaceException")
    void duplicatePlace() {
        User user = TestFixtures.createUser(userRepository);
        RestaurantRegisterRequest request = tonkatsuRequest("dup-place-1", "원조돈까스");

        restaurantService.register(request, user.getId());

        assertThatThrownBy(() -> restaurantService.register(request, user.getId()))
                .isInstanceOf(DuplicatePlaceException.class);
    }

    @Test
    @DisplayName("돈까스 카테고리가 아닌 가게 등록 → CategoryNotAllowedException")
    void categoryNotAllowed() {
        User user = TestFixtures.createUser(userRepository);
        RestaurantRegisterRequest request = new RestaurantRegisterRequest(
                "sushi-place-1", "초밥집", "서울 어딘가", "서울 어딘가로 1",
                new BigDecimal("37.5000000"), new BigDecimal("127.0000000"),
                "음식점 > 일식 > 초밥,롤", null, null);

        assertThatThrownBy(() -> restaurantService.register(request, user.getId()))
                .isInstanceOf(CategoryNotAllowedException.class);
    }

    @Test
    @DisplayName("서울 밖 주소로 가게 등록 → RegionNotAllowedException")
    void regionNotAllowed() {
        User user = TestFixtures.createUser(userRepository);
        RestaurantRegisterRequest request = new RestaurantRegisterRequest(
                "busan-place-1", "부산돈까스", "부산 금정구 장전동", "부산 금정구 장전로 1",
                new BigDecimal("35.2000000"), new BigDecimal("129.0000000"),
                "음식점 > 일식 > 돈까스,우동", null, null);

        assertThatThrownBy(() -> restaurantService.register(request, user.getId()))
                .isInstanceOf(RegionNotAllowedException.class);
    }

    @Test
    @DisplayName("존재하지 않는 가게 조회 → RestaurantNotFoundException")
    void getByIdNotFound() {
        assertThatThrownBy(() -> restaurantService.getById(999999L))
                .isInstanceOf(RestaurantNotFoundException.class);
    }

    @Test
    @DisplayName("검색어가 빈칸뿐이면 q 없는 것으로 취급 — 전체 목록 반환")
    void searchEmptyQuery() {
        var response = restaurantService.search("   ", 0, 20);
        assertThat(response.items()).isEmpty();
        assertThat(response.total()).isZero();
    }

    @Test
    @DisplayName("limit 상한 초과 → 50으로 클램핑")
    void searchLimitClamped() {
        // limit=100 을 넘겨도 예외 없이 50으로 클램핑
        var response = restaurantService.search("돈까스", 0, 100);
        assertThat(response.limit()).isEqualTo(50);
        assertThat(response.items()).isEmpty(); // 데이터 없으므로 빈 결과지만 예외 없음
    }

    // --- helpers ---

    private RestaurantRegisterRequest tonkatsuRequest(String kakaoPlaceId, String name) {
        return new RestaurantRegisterRequest(
                kakaoPlaceId, name, "서울 어딘가", "서울 어딘가로 1",
                new BigDecimal("37.5000000"), new BigDecimal("127.0000000"),
                "음식점 > 일식 > 돈까스,우동", null, "https://place.map.kakao.com/test");
    }
}
