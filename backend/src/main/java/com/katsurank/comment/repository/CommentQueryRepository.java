package com.katsurank.comment.repository;

import com.katsurank.comment.dto.CommentRow;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.katsurank.comment.QComment.comment;
import static com.katsurank.user.QUser.user;

@Repository
public class CommentQueryRepository {

    private final JPAQueryFactory queryFactory;

    public CommentQueryRepository(EntityManager entityManager) {
        this.queryFactory = new JPAQueryFactory(entityManager);
    }

    public List<CommentRow> findByRestaurantId(Long restaurantId, int offset, int limit) {
        return queryFactory.select(Projections.constructor(CommentRow.class,
                        comment.id,
                        comment.restaurantId,
                        comment.content,
                        user.id,
                        user.nickname,
                        user.profileImage,
                        comment.createdAt,
                        comment.updatedAt))
                .from(comment)
                .join(user).on(user.id.eq(comment.userId))
                .where(comment.restaurantId.eq(restaurantId))
                .orderBy(comment.createdAt.desc(), comment.id.desc())
                .offset(offset)
                .limit(limit)
                .fetch();
    }

    public long countByRestaurantId(Long restaurantId) {
        Long count = queryFactory.select(comment.count())
                .from(comment)
                .where(comment.restaurantId.eq(restaurantId))
                .fetchOne();
        return count == null ? 0 : count;
    }
}
