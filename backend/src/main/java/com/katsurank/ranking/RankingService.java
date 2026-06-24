package com.katsurank.ranking;

import com.katsurank.restaurant.Restaurant;
import com.katsurank.restaurant.RestaurantRepository;
import com.katsurank.restaurant.RestaurantStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class RankingService {

    private static final int MAX_LIMIT = 50;

    private final RestaurantRepository restaurantRepository;

    public RankingService(RestaurantRepository restaurantRepository) {
        this.restaurantRepository = restaurantRepository;
    }

    @Transactional(readOnly = true)
    public RankingResponse getRanking(int offset, int limit) {
        if (offset < 0) {
            throw new IllegalArgumentException("offset은 0 이상이어야 합니다.");
        }
        if (limit < 1 || limit > MAX_LIMIT) {
            throw new LimitExceededException();
        }

        Page<Restaurant> page = restaurantRepository.findRanking(
                RestaurantStatus.ACTIVE,
                new OffsetPageRequest(offset, limit));

        List<RankingItem> items = new ArrayList<>(page.getNumberOfElements());
        List<Restaurant> content = page.getContent();
        for (int i = 0; i < content.size(); i++) {
            items.add(RankingItem.of(content.get(i), offset + i + 1));
        }

        return new RankingResponse(items, page.getTotalElements(), offset, limit);
    }

    @Transactional(readOnly = true)
    public Optional<RankingItem> getTop() {
        return restaurantRepository.findFirstByStatusOrderByVoteCountDescIdAsc(RestaurantStatus.ACTIVE)
                .map(r -> RankingItem.of(r, 1));
    }

    @Transactional(readOnly = true)
    public List<MapPinResponse> getMapPins() {
        return restaurantRepository
                .findByStatusAndLatitudeIsNotNullAndLongitudeIsNotNull(RestaurantStatus.ACTIVE)
                .stream()
                .map(MapPinResponse::from)
                .toList();
    }
}
