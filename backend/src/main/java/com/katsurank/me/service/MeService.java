package com.katsurank.me.service;

import com.katsurank.me.dto.VoteHistoryItem;
import com.katsurank.me.dto.CurrentVoteResponse;
import com.katsurank.me.dto.MeResponse;
import com.katsurank.me.dto.CurrentVoteRow;
import com.katsurank.me.repository.MeQueryRepository;
import com.katsurank.common.web.PageResponse;
import com.katsurank.restaurant.RestaurantStatus;
import com.katsurank.user.User;
import com.katsurank.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MeService {

    private static final int MAX_LIMIT = 100;

    private final UserRepository userRepository;
    private final MeQueryRepository meQueryRepository;

    public MeService(UserRepository userRepository,
                     MeQueryRepository meQueryRepository) {
        this.userRepository = userRepository;
        this.meQueryRepository = meQueryRepository;
    }

    @Transactional(readOnly = true)
    public MeResponse getMe(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();

        CurrentVoteResponse currentVote = meQueryRepository.findCurrentVote(userId)
                .map(this::toCurrentVoteResponse)
                .orElse(null);

        return new MeResponse(user.getId(), user.getNickname(), user.getProfileImage(), currentVote);
    }

    @Transactional(readOnly = true)
    public PageResponse<VoteHistoryItem> getVoteHistory(Long userId, int offset, int limit) {
        int effectiveOffset = Math.max(offset, 0);
        int effectiveLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);

        List<VoteHistoryItem> items = meQueryRepository.findVoteHistory(userId, effectiveOffset, effectiveLimit);
        long total = meQueryRepository.countVoteHistory(userId);
        if (items.isEmpty()) {
            return new PageResponse<>(List.of(), total, effectiveOffset, effectiveLimit);
        }

        return new PageResponse<>(items, total, effectiveOffset, effectiveLimit);
    }

    private CurrentVoteResponse toCurrentVoteResponse(CurrentVoteRow row) {
        Long rank = row.restaurantStatus() == RestaurantStatus.ACTIVE
                ? meQueryRepository.countActiveRestaurantsWithVoteCountGreaterThan(row.voteCount()) + 1
                : null;
        return row.toResponse(rank);
    }
}
