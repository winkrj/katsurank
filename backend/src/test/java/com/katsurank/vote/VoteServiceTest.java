package com.katsurank.vote;

import com.katsurank.restaurant.Restaurant;
import com.katsurank.restaurant.RestaurantRepository;
import com.katsurank.support.TestFixtures;
import com.katsurank.user.User;
import com.katsurank.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 투표 정합성 테스트 — 1인 1표 · 표 이동 · 동시성(낙관적 락 + 재시도).
 *
 * <p>실제 PostgreSQL 에 커밋하며 동작한다(스레드별 독립 트랜잭션이 필요하므로 테스트는 비트랜잭션).
 * 생성한 데이터만 추적해 정리한다.
 */
@SpringBootTest
class VoteServiceTest {

    @Autowired VoteService voteService;
    @Autowired VoteRepository voteRepository;
    @Autowired TestVoteRepository testVoteRepository;
    @Autowired RestaurantRepository restaurantRepository;
    @Autowired UserRepository userRepository;

    private final List<Long> createdUserIds = new CopyOnWriteArrayList<>();
    private final List<Long> createdRestaurantIds = new CopyOnWriteArrayList<>();

    @AfterEach
    void cleanUp() {
        for (Long userId : createdUserIds) {
            userRepository.findById(userId).ifPresent(u -> {
                u.pointCurrentVoteTo(null);
                userRepository.save(u);
            });
        }
        if (!createdUserIds.isEmpty()) {
            testVoteRepository.deleteByUserIdIn(createdUserIds);
        }
        restaurantRepository.deleteAllById(createdRestaurantIds);
        userRepository.deleteAllById(createdUserIds);
        createdUserIds.clear();
        createdRestaurantIds.clear();
    }

    // --- 기본 정합성 ---

    @Test
    @DisplayName("처음 투표하면 유효표 1건 생성 + 가게 vote_count 1 + User.current_vote_id 갱신")
    void firstVote() {
        User user = newUser();
        Restaurant r = newRestaurant();

        VoteResponse res = voteService.vote(user.getId(), r.getId());

        assertThat(res.restaurantId()).isEqualTo(r.getId());
        assertThat(res.voteCount()).isEqualTo(1);
        assertThat(reload(r).getVoteCount()).isEqualTo(1);
        assertThat(voteRepository.countByRestaurantIdAndCurrentIsTrue(r.getId())).isEqualTo(1);
        assertThat(userRepository.findById(user.getId()).orElseThrow().getCurrentVoteId())
                .isEqualTo(res.voteId());
    }

    @Test
    @DisplayName("표 이동: 기존 표 박제 + 기존 가게 -1, 새 가게 +1, 유효표는 항상 1건")
    void moveVote() {
        User user = newUser();
        Restaurant a = newRestaurant();
        Restaurant b = newRestaurant();

        voteService.vote(user.getId(), a.getId());
        VoteResponse moved = voteService.vote(user.getId(), b.getId());

        assertThat(moved.restaurantId()).isEqualTo(b.getId());
        assertThat(reload(a).getVoteCount()).isZero();
        assertThat(reload(b).getVoteCount()).isEqualTo(1);
        assertThat(voteRepository.findByUserIdAndCurrentIsTrue(user.getId()).orElseThrow().getRestaurantId())
                .isEqualTo(b.getId());
        assertThat(voteRepository.countByRestaurantIdAndCurrentIsTrue(a.getId())).isZero();
    }

    @Test
    @DisplayName("같은 가게에 다시 투표하면 멱등 — 변화 없음")
    void revoteSameRestaurantIsIdempotent() {
        User user = newUser();
        Restaurant r = newRestaurant();

        VoteResponse first = voteService.vote(user.getId(), r.getId());
        VoteResponse again = voteService.vote(user.getId(), r.getId());

        assertThat(again.voteId()).isEqualTo(first.voteId());
        assertThat(reload(r).getVoteCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("ACTIVE 가 아닌 가게엔 투표 불가")
    void cannotVoteNonActive() {
        User user = newUser();
        Restaurant closed = restaurantRepository.save(createClosedRestaurant());
        createdRestaurantIds.add(closed.getId());

        assertThatThrownBy(() -> voteService.vote(user.getId(), closed.getId()))
                .isInstanceOf(RestaurantNotVotableException.class);
    }

    // --- 동시성 ---

    @Test
    @DisplayName("동시성: 같은 가게에 N명이 동시에 투표해도 vote_count == N")
    void concurrentVotesSameRestaurant() throws InterruptedException {
        int n = 20;
        Restaurant r = newRestaurant();
        List<User> users = newUsers(n);

        List<Throwable> errors = runConcurrently(n, i -> voteService.vote(users.get(i).getId(), r.getId()));

        assertThat(errors).isEmpty();
        assertThat(reload(r).getVoteCount()).isEqualTo(n);
        assertThat(voteRepository.countByRestaurantIdAndCurrentIsTrue(r.getId())).isEqualTo(n);
    }

    @Test
    @DisplayName("동시성: 같은 유저가 동시에 두 가게에 투표해도 유효표는 정확히 1건")
    void concurrentVotesSameUserRaceKeepsSingleVote() throws InterruptedException {
        int n = 16;
        User user = newUser();
        Restaurant a = newRestaurant();
        Restaurant b = newRestaurant();

        List<Throwable> errors = runConcurrently(n,
                i -> voteService.vote(user.getId(), (i % 2 == 0 ? a : b).getId()));

        assertThat(errors).isEmpty();
        assertThat(voteRepository.findByUserIdAndCurrentIsTrue(user.getId())).isPresent();
        int sum = reload(a).getVoteCount() + reload(b).getVoteCount();
        assertThat(sum).isEqualTo(1);
    }

    @Test
    @DisplayName("동시성: 여러 유저가 동시에 A→B 로 표를 옮겨도 A=0, B=N")
    void concurrentVoteMoves() throws InterruptedException {
        int n = 20;
        Restaurant a = newRestaurant();
        Restaurant b = newRestaurant();
        List<User> users = newUsers(n);

        for (User u : users) {
            voteService.vote(u.getId(), a.getId());
        }
        assertThat(reload(a).getVoteCount()).isEqualTo(n);

        List<Throwable> errors = runConcurrently(n, i -> voteService.vote(users.get(i).getId(), b.getId()));

        assertThat(errors).isEmpty();
        assertThat(reload(a).getVoteCount()).isZero();
        assertThat(reload(b).getVoteCount()).isEqualTo(n);
    }

    // --- helpers ---

    private List<Throwable> runConcurrently(int n, IndexedTask task) throws InterruptedException {
        ExecutorService pool = Executors.newFixedThreadPool(n);
        CountDownLatch ready = new CountDownLatch(n);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(n);
        List<Throwable> errors = new CopyOnWriteArrayList<>();
        try {
            for (int i = 0; i < n; i++) {
                final int idx = i;
                pool.submit(() -> {
                    ready.countDown();
                    try {
                        start.await();
                        task.run(idx);
                    } catch (Throwable t) {
                        errors.add(t);
                    } finally {
                        done.countDown();
                    }
                });
            }
            ready.await();
            start.countDown();
            assertThat(done.await(60, TimeUnit.SECONDS)).as("모든 투표 작업 완료").isTrue();
        } finally {
            pool.shutdownNow();
        }
        return errors;
    }

    @FunctionalInterface
    private interface IndexedTask {
        void run(int index);
    }

    private User newUser() {
        User user = TestFixtures.createUser(userRepository);
        createdUserIds.add(user.getId());
        return user;
    }

    private List<User> newUsers(int n) {
        List<User> users = TestFixtures.createUsers(userRepository, n);
        users.forEach(u -> createdUserIds.add(u.getId()));
        return users;
    }

    private Restaurant newRestaurant() {
        Restaurant r = TestFixtures.createRestaurant(restaurantRepository);
        createdRestaurantIds.add(r.getId());
        return r;
    }

    private Restaurant createClosedRestaurant() {
        Restaurant r = com.katsurank.restaurant.Restaurant.register(
                "test-closed-" + java.util.UUID.randomUUID(), "폐업돈까스", null, null, null, null,
                "음식점 > 일식 > 돈까스,우동", null, null, null);
        r.close();
        return r;
    }

    private Restaurant reload(Restaurant r) {
        return restaurantRepository.findById(r.getId()).orElseThrow();
    }
}
