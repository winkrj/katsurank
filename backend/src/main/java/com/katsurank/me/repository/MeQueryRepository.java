package com.katsurank.me.repository;

import com.katsurank.me.dto.CurrentVoteRow;
import com.katsurank.me.dto.VoteHistoryItem;
import com.katsurank.restaurant.RestaurantStatus;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import static com.katsurank.restaurant.QRestaurant.restaurant;
import static com.katsurank.vote.QVote.vote;

@Repository
public class MeQueryRepository {

    private final JPAQueryFactory queryFactory;

    public MeQueryRepository(EntityManager em) {
        this.queryFactory = new JPAQueryFactory(em);
    }

    public Optional<CurrentVoteRow> findCurrentVote(Long userId) {
        return Optional.ofNullable(queryFactory.select(Projections.constructor(CurrentVoteRow.class,
                        restaurant.id,
                        restaurant.name,
                        restaurant.status,
                        vote.votedAt,
                        restaurant.voteCount))
                .from(vote)
                .join(restaurant).on(restaurant.id.eq(vote.restaurantId))
                .where(vote.userId.eq(userId), vote.current.isTrue())
                .fetchOne());
    }

    public long countActiveRestaurantsWithVoteCountGreaterThan(int voteCount) {
        return queryFactory.select(restaurant.count())
                .from(restaurant)
                .where(restaurant.status.eq(RestaurantStatus.ACTIVE), restaurant.voteCount.gt(voteCount))
                .fetchOne();
    }

    public List<VoteHistoryItem> findVoteHistory(Long userId, int offset, int limit) {
        return queryFactory.select(Projections.constructor(VoteHistoryItem.class,
                        restaurant.id,
                        restaurant.name,
                        restaurant.status,
                        vote.votedAt,
                        vote.current))
                .from(vote)
                .join(restaurant).on(restaurant.id.eq(vote.restaurantId))
                .where(vote.userId.eq(userId))
                .orderBy(vote.votedAt.desc())
                .offset(offset)
                .limit(limit)
                .fetch();
    }

    public long countVoteHistory(Long userId) {
        return queryFactory.select(vote.count())
                .from(vote)
                .where(vote.userId.eq(userId))
                .fetchOne();
    }
}
