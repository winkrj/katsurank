package com.katsurank.vote.service;

import com.katsurank.vote.exception.VoteConflictException;
import com.katsurank.ranking.service.RankingChangeTracker;

import com.katsurank.vote.exception.RestaurantNotVotableException;

import com.katsurank.vote.repository.VoteRepository;

import com.katsurank.vote.dto.VoteResponse;

import com.katsurank.vote.Vote;

import com.katsurank.restaurant.Restaurant;
import com.katsurank.restaurant.exception.RestaurantNotFoundException;
import com.katsurank.restaurant.repository.RestaurantRepository;
import com.katsurank.user.User;
import com.katsurank.user.exception.UserNotFoundException;
import com.katsurank.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.concurrent.ThreadLocalRandom;
import java.time.Clock;
import java.time.Instant;

/**
 * 1인 1표 · 표 이동 — 이 서비스가 정합성의 핵심이다.
 *
 * <h2>표 이동(단일 트랜잭션 7단계)</h2>
 * <ol>
 *   <li>트랜잭션 시작</li>
 *   <li>기존 Vote {@code is_current=false} (박제, 히스토리 보존)</li>
 *   <li>기존 Restaurant {@code vote_count -1}</li>
 *   <li>새 Vote insert ({@code is_current=true})</li>
 *   <li>새 Restaurant {@code vote_count +1}</li>
 *   <li>User {@code current_vote_id} 갱신</li>
 *   <li>커밋</li>
 * </ol>
 *
 * <h2>동시성 3중 방어</h2>
 * <ul>
 *   <li><b>1인 1표</b>: {@code votes (user_id) WHERE is_current=TRUE} 부분 유니크 인덱스(DB 최종 보장).
 *       기존 표 박제를 <b>flush 로 먼저 반영</b>한 뒤 새 표를 insert 해 같은 트랜잭션 내 충돌을 피한다.</li>
 *   <li><b>vote_count 분실 갱신 방지</b>: {@code Restaurant} 의 {@code @Version} 낙관적 락.</li>
 *   <li><b>충돌 재시도</b>: 낙관적 락/유니크 경합 시 새 트랜잭션으로 재시도(아래 {@link #vote}).</li>
 * </ul>
 *
 * <p>재시도 루프를 {@link TransactionTemplate} 로 직접 도는 이유: 같은 빈 내부 호출은 {@code @Transactional}
 * 프록시가 적용되지 않아(self-invocation), 매 시도마다 독립된 새 트랜잭션을 보장하려면 프로그래밍 방식이 안전하다.
 */
@Service
public class VoteService {

    private static final Logger log = LoggerFactory.getLogger(VoteService.class);

    /** 핫 가게(왕좌)에 표가 몰릴 때를 대비한 재시도 한도. 초과 시 일시적 충돌로 보고 409. */
    private static final int MAX_ATTEMPTS = 50;

    private final VoteRepository voteRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;
    private final TransactionTemplate txTemplate;
    private final Clock clock;
    private final RankingChangeTracker rankingChangeTracker;

    public VoteService(VoteRepository voteRepository,
                       RestaurantRepository restaurantRepository,
                       UserRepository userRepository,
                       PlatformTransactionManager transactionManager,
                       Clock clock,
                       RankingChangeTracker rankingChangeTracker) {
        this.voteRepository = voteRepository;
        this.restaurantRepository = restaurantRepository;
        this.userRepository = userRepository;
        this.txTemplate = new TransactionTemplate(transactionManager);
        this.clock = clock;
        this.rankingChangeTracker = rankingChangeTracker;
    }

    /**
     * 투표 또는 표 이동. 낙관적 락/유니크 경합 시 새 트랜잭션으로 재시도한다.
     *
     * @return 갱신된 현재 유효표
     */
    public VoteResponse vote(Long userId, Long restaurantId) {
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                VoteAttemptResult result = txTemplate.execute(status -> doVote(userId, restaurantId));
                if (result.changed()) {
                    rankingChangeTracker.markCommitted(Instant.now(clock));
                }
                return result.response();
            } catch (OptimisticLockingFailureException | DataIntegrityViolationException | IllegalStateException ex) {
                if (attempt == MAX_ATTEMPTS) {
                    log.atWarn().addKeyValue("userId", userId).addKeyValue("restaurantId", restaurantId)
                            .addKeyValue("attempts", attempt).log("투표 재시도 한도 초과");
                    throw new VoteConflictException();
                }
                if (log.isDebugEnabled()) {
                    log.atDebug().addKeyValue("userId", userId).addKeyValue("restaurantId", restaurantId)
                            .addKeyValue("attempt", attempt).addKeyValue("cause", ex.getClass().getSimpleName())
                            .log("투표 충돌 재시도");
                }
                backoff(attempt);
            }
        }
        throw new VoteConflictException(); // 도달하지 않음(루프가 반환 또는 throw)
    }

    /** 7단계 본체. {@link TransactionTemplate} 가 트랜잭션 경계(1·7단계)를 담당한다. */
    private VoteAttemptResult doVote(Long userId, Long targetRestaurantId) {
        Restaurant target = restaurantRepository.findById(targetRestaurantId)
                .orElseThrow(() -> new RestaurantNotFoundException(targetRestaurantId));
        if (!target.isVotable()) {
            throw new RestaurantNotVotableException(targetRestaurantId);
        }

        Vote current = voteRepository.findByUserIdAndCurrentIsTrue(userId).orElse(null);
        if (current != null && current.getRestaurantId().equals(targetRestaurantId)) {
            return new VoteAttemptResult(VoteResponse.from(current, target), false); // 같은 가게 재투표 → 멱등
        }

        if (current != null) {
            // (2) 기존 표 박제 → flush 로 먼저 반영(부분 유니크 인덱스 충돌 회피)
            current.deactivate();
            voteRepository.flush();
            // (3) 기존 가게 표수 -1
            Restaurant previous = restaurantRepository.findById(current.getRestaurantId())
                    .orElseThrow(() -> new RestaurantNotFoundException(current.getRestaurantId()));
            previous.decreaseVoteCount();
        }

        // (4) 새 유효표 발행 (IDENTITY → 즉시 INSERT)
        Vote newVote = voteRepository.save(Vote.cast(userId, targetRestaurantId, Instant.now(clock)));
        // (5) 새 가게 표수 +1
        target.increaseVoteCount();
        // (6) User 현재 표 캐시 갱신
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        user.pointCurrentVoteTo(newVote.getId());

        return new VoteAttemptResult(VoteResponse.from(newVote, target), true);
    }

    private record VoteAttemptResult(VoteResponse response, boolean changed) {
    }

    private void backoff(int attempt) {
        try {
            // 소폭 지터로 thundering herd 완화 (가상 스레드라 블로킹 비용 낮음)
            long millis = ThreadLocalRandom.current().nextLong(1, Math.min(10L * attempt, 50L) + 1);
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new VoteConflictException();
        }
    }
}
