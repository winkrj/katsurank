package com.katsurank.me;

import com.katsurank.restaurant.Restaurant;
import com.katsurank.restaurant.RestaurantRepository;
import com.katsurank.restaurant.RestaurantStatus;
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
class MeServiceTest {

    @Autowired MeService meService;
    @Autowired VoteService voteService;
    @Autowired RestaurantRepository restaurantRepository;
    @Autowired UserRepository userRepository;

    @Test
    @DisplayName("투표 이력 없는 신규 유저 → currentVote: null, history []")
    void newUserNoVote() {
        User user = newUser();

        MeResponse me = meService.getMe(user.getId());

        assertThat(me.id()).isEqualTo(user.getId());
        assertThat(me.nickname()).isEqualTo(user.getNickname());
        assertThat(me.currentVote()).isNull();

        List<VoteHistoryItem> history = meService.getVoteHistory(user.getId());
        assertThat(history).isEmpty();
    }

    @Test
    @DisplayName("투표 후 → currentVote에 가게 정보 + rank 포함")
    void afterVote() {
        User user = newUser();
        Restaurant r = newRestaurant("명동돈가스");
        voteService.vote(user.getId(), r.getId());

        MeResponse me = meService.getMe(user.getId());

        assertThat(me.currentVote()).isNotNull();
        assertThat(me.currentVote().restaurantId()).isEqualTo(r.getId());
        assertThat(me.currentVote().restaurantName()).isEqualTo("명동돈가스");
        assertThat(me.currentVote().restaurantStatus()).isEqualTo(RestaurantStatus.ACTIVE);
        assertThat(me.currentVote().rank()).isEqualTo(1L);
    }

    @Test
    @DisplayName("표 이동 → history 2개 (최신순), isCurrent 각각 true/false")
    void moveVoteHistory() {
        User user = newUser();
        Restaurant a = newRestaurant("가게A");
        Restaurant b = newRestaurant("가게B");

        voteService.vote(user.getId(), a.getId());
        voteService.vote(user.getId(), b.getId());

        List<VoteHistoryItem> history = meService.getVoteHistory(user.getId());

        assertThat(history).hasSize(2);
        assertThat(history.get(0).restaurantId()).isEqualTo(b.getId());
        assertThat(history.get(0).isCurrent()).isTrue();
        assertThat(history.get(1).restaurantId()).isEqualTo(a.getId());
        assertThat(history.get(1).isCurrent()).isFalse();
    }

    @Test
    @DisplayName("CLOSED 가게 투표 중 → restaurantStatus: CLOSED, rank: null")
    void closedRestaurantRankNull() {
        User user = newUser();
        Restaurant r = newRestaurant("폐업가게");
        voteService.vote(user.getId(), r.getId());

        Restaurant loaded = restaurantRepository.findById(r.getId()).orElseThrow();
        loaded.close();
        restaurantRepository.save(loaded);

        MeResponse me = meService.getMe(user.getId());

        assertThat(me.currentVote().restaurantStatus()).isEqualTo(RestaurantStatus.CLOSED);
        assertThat(me.currentVote().rank()).isNull();
    }

    // --- helpers ---

    private User newUser() {
        long kakaoId = ThreadLocalRandom.current().nextLong(1, Long.MAX_VALUE);
        return userRepository.save(User.register(kakaoId, "tester-" + kakaoId, null));
    }

    private Restaurant newRestaurant(String name) {
        return restaurantRepository.save(Restaurant.register(
                "test-" + UUID.randomUUID(), name, "서울 어딘가", "서울 어딘가로 1",
                new BigDecimal("37.5000000"), new BigDecimal("127.0000000"),
                "음식점 > 일식 > 돈까스,우동", null, "https://place.map.kakao.com/test", null));
    }
}
