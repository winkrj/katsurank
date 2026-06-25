package com.katsurank.restaurant;

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

    public List<Restaurant> searchByName(String name, int limit) {
        return queryFactory.selectFrom(restaurant)
                .where(restaurant.status.eq(RestaurantStatus.ACTIVE),
                       restaurant.name.containsIgnoreCase(name))
                .orderBy(restaurant.voteCount.desc(), restaurant.id.asc())
                .limit(limit)
                .fetch();
    }

    public long countWithVoteCountGreaterThan(int voteCount) {
        return queryFactory.select(restaurant.count())
                .from(restaurant)
                .where(restaurant.status.eq(RestaurantStatus.ACTIVE),
                       restaurant.voteCount.gt(voteCount))
                .fetchOne();
    }

    public List<Restaurant> findActivePinsWithCoordinates() {
        return queryFactory.selectFrom(restaurant)
                .where(restaurant.status.eq(RestaurantStatus.ACTIVE),
                       restaurant.latitude.isNotNull(),
                       restaurant.longitude.isNotNull())
                .fetch();
    }
}
