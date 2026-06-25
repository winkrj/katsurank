package com.katsurank.me;

import com.katsurank.vote.Vote;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.katsurank.vote.QVote.vote;

@Repository
public class MeQueryRepository {

    private final JPAQueryFactory queryFactory;

    public MeQueryRepository(EntityManager em) {
        this.queryFactory = new JPAQueryFactory(em);
    }

    public List<Vote> findVoteHistory(Long userId) {
        return queryFactory.selectFrom(vote)
                .where(vote.userId.eq(userId))
                .orderBy(vote.votedAt.desc())
                .fetch();
    }
}
