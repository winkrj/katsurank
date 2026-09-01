package com.katsurank.ranking.service;

import com.katsurank.restaurant.repository.RestaurantRepository;
import com.katsurank.support.CleanUp;
import com.katsurank.support.TestFixtures;
import com.katsurank.user.User;
import com.katsurank.user.repository.UserRepository;
import com.katsurank.vote.TestVoteRepository;
import com.katsurank.vote.service.VoteService;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.jdbc.Sql;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.context.jdbc.Sql.ExecutionPhase.AFTER_TEST_METHOD;
import static org.springframework.test.context.jdbc.Sql.ExecutionPhase.BEFORE_TEST_METHOD;

@SpringBootTest(properties = {"ranking.cache.enabled=true", "ranking.cache.refresh-delay=1h"})
@Sql(statements = {CleanUp.SQL_CLEAR_VOTES, CleanUp.SQL_DELETE_VOTES, CleanUp.SQL_DELETE_RESTAURANTS},
        executionPhase = BEFORE_TEST_METHOD)
@Sql(statements = {CleanUp.SQL_CLEAR_VOTES, CleanUp.SQL_DELETE_VOTES, CleanUp.SQL_DELETE_RESTAURANTS},
        executionPhase = AFTER_TEST_METHOD)
class RankingCacheIntegrationTest {

    @Autowired RankingService rankingService;
    @Autowired VoteService voteService;
    @Autowired RestaurantRepository restaurantRepository;
    @Autowired UserRepository userRepository;
    @Autowired TestVoteRepository testVoteRepository;
    @Autowired MeterRegistry meterRegistry;
    private Long createdUserId;

    @AfterEach
    void deleteCreatedUser() {
        if (createdUserId == null) {
            return;
        }
        userRepository.findById(createdUserId).ifPresent(user -> {
            user.pointCurrentVoteTo(null);
            userRepository.save(user);
        });
        testVoteRepository.deleteByUserIdIn(java.util.List.of(createdUserId));
        userRepository.deleteById(createdUserId);
    }

    @Test
    void committedVoteRefreshesCachedRankingAndBroadcastsThroughRealBeans() {
        var restaurant = TestFixtures.createRestaurant(restaurantRepository, "캐시 통합 돈까스");
        User user = TestFixtures.createUser(userRepository);
        createdUserId = user.getId();
        rankingService.refreshRankingCache();
        double broadcastsBeforeVote = broadcasts();

        assertThat(rankingService.getRanking(0, 20).items().getFirst().voteCount()).isZero();

        voteService.vote(user.getId(), restaurant.getId());

        assertThat(rankingService.getRanking(0, 20).items().getFirst().voteCount()).isZero();
        rankingService.refreshRankingCache();

        assertThat(rankingService.getRanking(0, 20).items().getFirst().voteCount()).isEqualTo(1);
        assertThat(broadcasts()).isEqualTo(broadcastsBeforeVote + 1);
        assertThat(meterRegistry.get("ranking.cache.hits").counter().count()).isGreaterThanOrEqualTo(3);
    }

    private double broadcasts() {
        return meterRegistry.get("ranking.sse.broadcasts").counter().count();
    }
}
