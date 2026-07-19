package com.katsurank.ranking.repository;

import com.katsurank.ranking.dto.MapPinResponse;
import com.katsurank.ranking.dto.RankingRow;
import com.katsurank.restaurant.RestaurantStatus;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import static com.katsurank.restaurant.QRestaurant.restaurant;

/** 서울 단일 랭킹과 지도 핀을 위한 읽기 전용 조회. */
@Repository
public class RankingQueryRepository {

    private final JPAQueryFactory queryFactory;

    public RankingQueryRepository(EntityManager em) {
        this.queryFactory = new JPAQueryFactory(em);
    }

    public List<RankingRow> findActiveRanking(int offset, int limit) {
        return queryFactory.select(Projections.constructor(RankingRow.class,
                        restaurant.id,
                        restaurant.name,
                        restaurant.address,
                        restaurant.latitude,
                        restaurant.longitude,
                        restaurant.voteCount,
                        restaurant.placeUrl))
                .from(restaurant)
                .where(restaurant.status.eq(RestaurantStatus.ACTIVE))
                .orderBy(restaurant.voteCount.desc(), restaurant.id.asc())
                .offset(offset)
                .limit(limit)
                .fetch();
    }

    public long countActiveRestaurants() {
        return queryFactory.select(restaurant.count())
                .from(restaurant)
                .where(restaurant.status.eq(RestaurantStatus.ACTIVE))
                .fetchOne();
    }

    public Optional<RankingRow> findTop() {
        return Optional.ofNullable(queryFactory.select(Projections.constructor(RankingRow.class,
                        restaurant.id,
                        restaurant.name,
                        restaurant.address,
                        restaurant.latitude,
                        restaurant.longitude,
                        restaurant.voteCount,
                        restaurant.placeUrl))
                .from(restaurant)
                .where(restaurant.status.eq(RestaurantStatus.ACTIVE))
                .orderBy(restaurant.voteCount.desc(), restaurant.id.asc())
                .fetchFirst());
    }

    public long countWithVoteCountGreaterThan(int voteCount) {
        return queryFactory.select(restaurant.count())
                .from(restaurant)
                .where(restaurant.status.eq(RestaurantStatus.ACTIVE), restaurant.voteCount.gt(voteCount))
                .fetchOne();
    }

    public List<MapPinResponse> findActivePinsWithCoordinates() {
        return queryFactory.select(Projections.constructor(MapPinResponse.class,
                        restaurant.id,
                        restaurant.name,
                        restaurant.latitude,
                        restaurant.longitude,
                        restaurant.voteCount))
                .from(restaurant)
                .where(restaurant.status.eq(RestaurantStatus.ACTIVE),
                        restaurant.latitude.isNotNull(),
                        restaurant.longitude.isNotNull())
                .fetch();
    }
}
