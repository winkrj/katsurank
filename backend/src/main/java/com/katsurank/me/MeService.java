package com.katsurank.me;

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
    public List<VoteHistoryItem> getVoteHistory(Long userId) {
        List<Vote> votes = meQueryRepository.findVoteHistory(userId);
        if (votes.isEmpty()) return List.of();

        List<Long> restaurantIds = votes.stream().map(Vote::getRestaurantId).distinct().toList();
        Map<Long, Restaurant> restaurantMap = restaurantRepository.findAllById(restaurantIds)
                .stream().collect(Collectors.toMap(Restaurant::getId, Function.identity()));

        return votes.stream()
                .map(v -> VoteHistoryItem.of(v, restaurantMap.get(v.getRestaurantId())))
                .toList();
    }
}
