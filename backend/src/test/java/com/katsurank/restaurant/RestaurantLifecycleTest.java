package com.katsurank.restaurant;

import com.katsurank.me.MeService;
import com.katsurank.me.VoteHistoryItem;
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

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
@Sql(statements = {CleanUp.SQL_CLEAR_VOTES, CleanUp.SQL_DELETE_VOTES, CleanUp.SQL_DELETE_RESTAURANTS})
class RestaurantLifecycleTest {

    @Autowired RestaurantService restaurantService;
    @Autowired VoteService voteService;
    @Autowired MeService meService;
    @Autowired RestaurantRepository restaurantRepository;
    @Autowired UserRepository userRepository;

    @Test
    @DisplayName("폐업 → voteCount 유지, 랭킹 제외, 유저 currentVoteId=null")
    void closeRestaurant() {
        Restaurant r = newRestaurant("폐업가게");
        List<User> users = voteN(r, 10);

        CloseResponse response = restaurantService.close(r.getId());

        assertThat(response.status()).isEqualTo(RestaurantStatus.CLOSED);
        assertThat(response.closedAt()).isNotNull();

        Restaurant closed = restaurantRepository.findById(r.getId()).orElseThrow();
        assertThat(closed.getVoteCount()).isEqualTo(10);

        for (User u : users) {
            assertThat(meService.getMe(u.getId()).currentVote()).isNull();
        }
    }

    @Test
    @DisplayName("이미 CLOSED 가게에 close → 409")
    void closeAlreadyClosed() {
        Restaurant r = newRestaurant("가게");
        restaurantService.close(r.getId());

        assertThatThrownBy(() -> restaurantService.close(r.getId()))
                .isInstanceOf(AlreadyClosedException.class);
    }

    @Test
    @DisplayName("이전 → 기존 표 새 가게로 이동, voteCount 조정")
    void relocateRestaurant() {
        Restaurant old = newRestaurant("기존가게");
        Restaurant neo = newRestaurant("새가게");
        voteN(old, 5);
        voteN(neo, 3);

        RelocateResponse response = restaurantService.relocate(
                old.getId(), new RelocateRequest(neo.getKakaoPlaceId()));

        assertThat(response.movedVoteCount()).isEqualTo(5);

        Restaurant oldReloaded = restaurantRepository.findById(old.getId()).orElseThrow();
        Restaurant newReloaded = restaurantRepository.findById(neo.getId()).orElseThrow();
        assertThat(oldReloaded.getStatus()).isEqualTo(RestaurantStatus.RELOCATED);
        assertThat(oldReloaded.getVoteCount()).isZero();
        assertThat(newReloaded.getVoteCount()).isEqualTo(8);
    }

    @Test
    @DisplayName("RELOCATED 가게에 relocate → 409")
    void relocateAlreadyRelocated() {
        Restaurant old = newRestaurant("기존");
        Restaurant neo = newRestaurant("새곳");

        restaurantService.relocate(old.getId(), new RelocateRequest(neo.getKakaoPlaceId()));

        assertThatThrownBy(() -> restaurantService.relocate(
                old.getId(), new RelocateRequest(neo.getKakaoPlaceId())))
                .isInstanceOf(AlreadyClosedException.class);
    }

    @Test
    @DisplayName("존재하지 않는 id → 404")
    void closeNotFound() {
        assertThatThrownBy(() -> restaurantService.close(999999L))
                .isInstanceOf(RestaurantNotFoundException.class);
    }

    @Test
    @DisplayName("이전 시 유저의 vote-history에 기록 남음")
    void relocateVoteHistory() {
        Restaurant old = newRestaurant("기존가게");
        Restaurant neo = newRestaurant("새가게");
        User user = TestFixtures.createUser(userRepository);
        voteService.vote(user.getId(), old.getId());

        restaurantService.relocate(old.getId(), new RelocateRequest(neo.getKakaoPlaceId()));

        List<VoteHistoryItem> history = meService.getVoteHistory(user.getId());
        assertThat(history).hasSize(2);
        assertThat(history.get(0).restaurantId()).isEqualTo(neo.getId());
        assertThat(history.get(0).isCurrent()).isTrue();
        assertThat(history.get(1).restaurantId()).isEqualTo(old.getId());
        assertThat(history.get(1).isCurrent()).isFalse();
    }

    // --- helpers ---

    private List<User> voteN(Restaurant restaurant, int count) {
        List<User> users = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            User user = TestFixtures.createUser(userRepository);
            voteService.vote(user.getId(), restaurant.getId());
            users.add(user);
        }
        return users;
    }

    private Restaurant newRestaurant(String name) {
        return TestFixtures.createRestaurant(restaurantRepository, name);
    }
}
