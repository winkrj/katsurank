package com.katsurank.me;

import com.katsurank.common.web.PageResponse;
import com.katsurank.restaurant.Restaurant;
import com.katsurank.restaurant.RestaurantQueryRepository;
import com.katsurank.restaurant.RestaurantRepository;
import com.katsurank.restaurant.RestaurantStatus;
import com.katsurank.user.User;
import com.katsurank.user.UserRepository;
import com.katsurank.vote.Vote;
import com.katsurank.vote.VoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class MeService {

    private static final int MAX_LIMIT = 100;

    private final UserRepository userRepository;
    private final VoteRepository voteRepository;
    private final RestaurantRepository restaurantRepository;
    private final RestaurantQueryRepository restaurantQueryRepository;
    private final MeQueryRepository meQueryRepository;

    public MeService(UserRepository userRepository,
                     VoteRepository voteRepository,
                     RestaurantRepository restaurantRepository,
                     RestaurantQueryRepository restaurantQueryRepository,
                     MeQueryRepository meQueryRepository) {
        this.userRepository = userRepository;
        this.voteRepository = voteRepository;
        this.restaurantRepository = restaurantRepository;
        this.restaurantQueryRepository = restaurantQueryRepository;
        this.meQueryRepository = meQueryRepository;
    }

    @Transactional(readOnly = true)
    public MeResponse getMe(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();

        CurrentVoteResponse currentVote = null;
        Vote vote = voteRepository.findByUserIdAndCurrentIsTrue(userId).orElse(null);
        if (vote != null) {
            Restaurant restaurant = restaurantRepository.findById(vote.getRestaurantId()).orElseThrow();
            Long rank = restaurant.getStatus() == RestaurantStatus.ACTIVE
                    ? restaurantQueryRepository.countWithVoteCountGreaterThan(restaurant.getVoteCount()) + 1
                    : null;
            currentVote = CurrentVoteResponse.of(vote, restaurant, rank);
        }

        return new MeResponse(user.getId(), user.getNickname(), user.getProfileImage(), currentVote);
    }

    @Transactional(readOnly = true)
    public PageResponse<VoteHistoryItem> getVoteHistory(Long userId, int offset, int limit) {
        int effectiveOffset = Math.max(offset, 0);
        int effectiveLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);

        List<Vote> votes = meQueryRepository.findVoteHistory(userId, effectiveOffset, effectiveLimit);
        long total = meQueryRepository.countVoteHistory(userId);
        if (votes.isEmpty()) {
            return new PageResponse<>(List.of(), total, effectiveOffset, effectiveLimit);
        }

        List<Long> restaurantIds = votes.stream().map(Vote::getRestaurantId).distinct().toList();
        Map<Long, Restaurant> restaurantMap = restaurantRepository.findAllById(restaurantIds)
                .stream().collect(Collectors.toMap(Restaurant::getId, Function.identity()));

        List<VoteHistoryItem> items = votes.stream()
                .filter(v -> restaurantMap.containsKey(v.getRestaurantId()))
                .map(v -> VoteHistoryItem.of(v, restaurantMap.get(v.getRestaurantId())))
                .toList();

        return new PageResponse<>(items, total, effectiveOffset, effectiveLimit);
    }
}
