package com.katsurank.ranking;

import com.katsurank.common.web.PageResponse;
import com.katsurank.restaurant.Restaurant;
import com.katsurank.restaurant.RestaurantQueryRepository;
import com.katsurank.restaurant.RestaurantRepository;
import com.katsurank.restaurant.RestaurantStatus;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class RankingService {

    private static final int MAX_LIMIT = 100;

    private final RestaurantRepository restaurantRepository;
    private final RestaurantQueryRepository restaurantQueryRepository;

    public RankingService(RestaurantRepository restaurantRepository,
                          RestaurantQueryRepository restaurantQueryRepository) {
        this.restaurantRepository = restaurantRepository;
        this.restaurantQueryRepository = restaurantQueryRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<RankingItem> getRanking(int offset, int limit) {
        if (offset < 0) {
            throw new IllegalArgumentException("offset은 0 이상이어야 합니다.");
        }
        if (limit < 1 || limit > MAX_LIMIT) {
            throw new LimitExceededException();
        }

        Page<Restaurant> page = restaurantRepository.findRanking(
                RestaurantStatus.ACTIVE,
                new OffsetPageRequest(offset, limit));

        List<Restaurant> content = page.getContent();
        List<RankingItem> items = new ArrayList<>(content.size());
        Map<Integer, Long> rankByVoteCount = new HashMap<>();
        for (Restaurant restaurant : content) {
            long rank = rankByVoteCount.computeIfAbsent(restaurant.getVoteCount(),
                    voteCount -> restaurantQueryRepository.countWithVoteCountGreaterThan(voteCount) + 1);
            items.add(RankingItem.of(restaurant, (int) rank));
        }

        return new PageResponse<>(items, page.getTotalElements(), offset, limit);
    }

    @Transactional(readOnly = true)
    public Optional<RankingItem> getTop() {
        return restaurantRepository.findFirstByStatusOrderByVoteCountDescIdAsc(RestaurantStatus.ACTIVE)
                .map(r -> RankingItem.of(r, 1));
    }

    @Transactional(readOnly = true)
    public List<MapPinResponse> getMapPins() {
        return restaurantQueryRepository.findActivePinsWithCoordinates()
                .stream()
                .map(MapPinResponse::from)
                .toList();
    }
}
