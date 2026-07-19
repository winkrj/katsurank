package com.katsurank.restaurant.repository;

import com.katsurank.restaurant.Restaurant;

import com.katsurank.restaurant.RestaurantStatus;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.katsurank.restaurant.QRestaurant.restaurant;

@Repository
public class RestaurantQueryRepository {

    private final JPAQueryFactory queryFactory;

    public RestaurantQueryRepository(EntityManager em) {
        this.queryFactory = new JPAQueryFactory(em);
    }

    /** name이 없으면(null/blank) 전체 ACTIVE 가게를 vote_count 순으로 반환. */
    public List<Restaurant> search(String name, int offset, int limit) {
        return queryFactory.selectFrom(restaurant)
                .where(restaurant.status.eq(RestaurantStatus.ACTIVE),
                       nameContains(name))
                .orderBy(restaurant.voteCount.desc(), restaurant.id.asc())
                .offset(offset)
                .limit(limit)
                .fetch();
    }

    public long countSearch(String name) {
        return queryFactory.select(restaurant.count())
                .from(restaurant)
                .where(restaurant.status.eq(RestaurantStatus.ACTIVE),
                       nameContains(name))
                .fetchOne();
    }

    private BooleanExpression nameContains(String name) {
        return (name == null || name.isBlank()) ? null : restaurant.name.containsIgnoreCase(name);
    }

    public long countWithVoteCountGreaterThan(int voteCount) {
        return queryFactory.select(restaurant.count())
                .from(restaurant)
                .where(restaurant.status.eq(RestaurantStatus.ACTIVE),
                       restaurant.voteCount.gt(voteCount))
                .fetchOne();
    }

}
