package com.katsurank.restaurant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RestaurantService {

    private static final Logger log = LoggerFactory.getLogger(RestaurantService.class);
    private static final int MAX_SEARCH_LIMIT = 50;

    private final RestaurantRepository restaurantRepository;
    private final RestaurantQueryRepository restaurantQueryRepository;

    public RestaurantService(RestaurantRepository restaurantRepository,
                             RestaurantQueryRepository restaurantQueryRepository) {
        this.restaurantRepository = restaurantRepository;
        this.restaurantQueryRepository = restaurantQueryRepository;
    }

    @Transactional
    public RestaurantResponse register(RestaurantRegisterRequest request, Long userId) {
        if (restaurantRepository.existsByKakaoPlaceId(request.kakaoPlaceId())) {
            throw new DuplicatePlaceException(request.kakaoPlaceId());
        }
        if (!CategoryValidator.isTonkatsu(request.kakaoCategory())) {
            throw new CategoryNotAllowedException(request.kakaoCategory());
        }

        Restaurant restaurant = Restaurant.register(
                request.kakaoPlaceId(),
                request.name(),
                request.address(),
                request.roadAddress(),
                request.latitude(),
                request.longitude(),
                request.kakaoCategory(),
                request.phone(),
                request.placeUrl(),
                userId);

        Restaurant saved;
        try {
            saved = restaurantRepository.saveAndFlush(restaurant);
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicatePlaceException(request.kakaoPlaceId());
        }
        log.info("가게 등록 id={} status={} kakaoPlaceId={} by userId={}",
                saved.getId(), saved.getStatus(), saved.getKakaoPlaceId(), userId);
        return RestaurantResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public RestaurantResponse getById(Long id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new RestaurantNotFoundException(id));
        Long rank = restaurant.getStatus() == RestaurantStatus.ACTIVE
                ? computeRank(restaurant.getVoteCount())
                : null;
        return RestaurantResponse.from(restaurant, rank);
    }

    @Transactional(readOnly = true)
    public List<RestaurantSearchResponse> search(String query, int limit) {
        int effectiveLimit = Math.min(Math.max(limit, 1), MAX_SEARCH_LIMIT);
        List<Restaurant> results = restaurantQueryRepository.searchByName(query.trim(), effectiveLimit);
        Map<Integer, Long> rankCache = new HashMap<>();
        return results.stream()
                .map(r -> RestaurantSearchResponse.of(r,
                        rankCache.computeIfAbsent(r.getVoteCount(), this::computeRank)))
                .toList();
    }

    private long computeRank(int voteCount) {
        return restaurantQueryRepository.countWithVoteCountGreaterThan(voteCount) + 1;
    }
}
