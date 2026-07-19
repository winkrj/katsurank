package com.katsurank.me;

import com.katsurank.common.web.PageResponse;
import com.katsurank.restaurant.Restaurant;
import com.katsurank.restaurant.RestaurantRepository;
import com.katsurank.restaurant.RestaurantStatus;
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
class MeServiceTest {

    @Autowired MeService meService;
    @Autowired VoteService voteService;
    @Autowired RestaurantRepository restaurantRepository;
    @Autowired UserRepository userRepository;

    @Test
    @DisplayName("투표 이력 없는 신규 유저 → currentVote: null, history []")
    void newUserNoVote() {
        User user = TestFixtures.createUser(userRepository);

        MeResponse me = meService.getMe(user.getId());

        assertThat(me.id()).isEqualTo(user.getId());
        assertThat(me.nickname()).isEqualTo(user.getNickname());
        assertThat(me.currentVote()).isNull();

        PageResponse<VoteHistoryItem> history = meService.getVoteHistory(user.getId(), 0, 20);
        assertThat(history.items()).isEmpty();
        assertThat(history.total()).isZero();
    }

    @Test
    @DisplayName("투표 후 → currentVote에 가게 정보 + rank 포함")
    void afterVote() {
        User user = TestFixtures.createUser(userRepository);
        Restaurant r = TestFixtures.createRestaurant(restaurantRepository, "명동돈가스");
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
        User user = TestFixtures.createUser(userRepository);
        Restaurant a = TestFixtures.createRestaurant(restaurantRepository, "가게A");
        Restaurant b = TestFixtures.createRestaurant(restaurantRepository, "가게B");

        voteService.vote(user.getId(), a.getId());
        voteService.vote(user.getId(), b.getId());

        PageResponse<VoteHistoryItem> history = meService.getVoteHistory(user.getId(), 0, 20);

        assertThat(history.items()).hasSize(2);
        assertThat(history.total()).isEqualTo(2);
        assertThat(history.items().get(0).restaurantId()).isEqualTo(b.getId());
        assertThat(history.items().get(0).isCurrent()).isTrue();
        assertThat(history.items().get(1).restaurantId()).isEqualTo(a.getId());
        assertThat(history.items().get(1).isCurrent()).isFalse();
    }

    @Test
    @DisplayName("CLOSED 가게 투표 중 → restaurantStatus: CLOSED, rank: null")
    void closedRestaurantRankNull() {
        User user = TestFixtures.createUser(userRepository);
        Restaurant r = TestFixtures.createRestaurant(restaurantRepository, "폐업가게");
        voteService.vote(user.getId(), r.getId());

        Restaurant loaded = restaurantRepository.findById(r.getId()).orElseThrow();
        loaded.close();
        restaurantRepository.save(loaded);

        MeResponse me = meService.getMe(user.getId());

        assertThat(me.currentVote().restaurantStatus()).isEqualTo(RestaurantStatus.CLOSED);
        assertThat(me.currentVote().rank()).isNull();
    }
}
