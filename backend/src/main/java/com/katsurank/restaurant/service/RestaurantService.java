package com.katsurank.restaurant.service;

import com.katsurank.restaurant.repository.RestaurantRepository;

import com.katsurank.restaurant.repository.RestaurantQueryRepository;

import com.katsurank.restaurant.dto.RelocateResponse;

import com.katsurank.restaurant.dto.RestaurantSearchResponse;

import com.katsurank.restaurant.dto.CloseResponse;

import com.katsurank.restaurant.dto.RestaurantResponse;

import com.katsurank.restaurant.Restaurant;

import com.katsurank.restaurant.CategoryValidator;

import com.katsurank.restaurant.RestaurantStatus;

import com.katsurank.restaurant.exception.CategoryNotAllowedException;

import com.katsurank.restaurant.exception.DuplicatePlaceException;

import com.katsurank.restaurant.exception.RestaurantNotFoundException;

import com.katsurank.restaurant.exception.NewPlaceNotFoundException;

import com.katsurank.restaurant.exception.RegionNotAllowedException;

import com.katsurank.restaurant.exception.AlreadyClosedException;

import com.katsurank.restaurant.SeoulAddressValidator;

import com.katsurank.common.web.PageResponse;
import com.katsurank.user.User;
import com.katsurank.user.repository.UserRepository;
import com.katsurank.vote.Vote;
import com.katsurank.vote.repository.VoteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.Instant;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class RestaurantService {

    private static final Logger log = LoggerFactory.getLogger(RestaurantService.class);
    private static final int MAX_SEARCH_LIMIT = 50;
    private static final int MAX_RETRY = 3;

    private final RestaurantRepository restaurantRepository;
    private final RestaurantQueryRepository restaurantQueryRepository;
    private final VoteRepository voteRepository;
    private final UserRepository userRepository;
    private final TransactionTemplate txTemplate;
    private final Clock clock;

    public RestaurantService(RestaurantRepository restaurantRepository,
                             RestaurantQueryRepository restaurantQueryRepository,
                             VoteRepository voteRepository,
                             UserRepository userRepository,
                             PlatformTransactionManager transactionManager,
                             Clock clock) {
        this.restaurantRepository = restaurantRepository;
        this.restaurantQueryRepository = restaurantQueryRepository;
        this.voteRepository = voteRepository;
        this.userRepository = userRepository;
        this.txTemplate = new TransactionTemplate(transactionManager);
        this.clock = clock;
    }

    @Transactional
    public RestaurantResponse register(String kakaoPlaceId, String name, String address, String roadAddress,
                                       BigDecimal latitude, BigDecimal longitude, String kakaoCategory,
                                       String phone, String placeUrl, Long userId) {
        if (restaurantRepository.existsByKakaoPlaceId(kakaoPlaceId)) {
            throw new DuplicatePlaceException(kakaoPlaceId);
        }
        if (!CategoryValidator.isTonkatsu(kakaoCategory)) {
            throw new CategoryNotAllowedException(kakaoCategory);
        }
        if (!SeoulAddressValidator.isSeoul(address, roadAddress)) {
            throw new RegionNotAllowedException(address);
        }

        Restaurant restaurant = Restaurant.register(
                kakaoPlaceId, name, address, roadAddress, latitude, longitude, kakaoCategory, phone, placeUrl,
                userId);

        Restaurant saved;
        try {
            saved = restaurantRepository.saveAndFlush(restaurant);
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicatePlaceException(kakaoPlaceId);
        }
        log.atInfo().addKeyValue("restaurantId", saved.getId()).addKeyValue("status", saved.getStatus())
                .addKeyValue("kakaoPlaceId", saved.getKakaoPlaceId()).addKeyValue("userId", userId)
                .log("가게 등록");
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
    public PageResponse<RestaurantSearchResponse> search(String query, int offset, int limit) {
        int effectiveOffset = Math.max(offset, 0);
        int effectiveLimit = Math.min(Math.max(limit, 1), MAX_SEARCH_LIMIT);
        String trimmedQuery = (query == null || query.isBlank()) ? null : query.trim();

        List<Restaurant> results = restaurantQueryRepository.search(trimmedQuery, effectiveOffset, effectiveLimit);
        long total = restaurantQueryRepository.countSearch(trimmedQuery);

        Map<Integer, Long> rankCache = new HashMap<>();
        List<RestaurantSearchResponse> items = results.stream()
                .map(r -> RestaurantSearchResponse.from(r,
                        rankCache.computeIfAbsent(r.getVoteCount(), this::computeRank)))
                .toList();

        return new PageResponse<>(items, total, effectiveOffset, effectiveLimit);
    }

    @Transactional
    public CloseResponse close(Long id) {
        Restaurant restaurant = findActiveOrThrow(id);
        restaurant.close(Instant.now(clock));

        List<Vote> currentVotes = voteRepository.findByRestaurantIdAndCurrentIsTrue(id);
        List<Long> userIds = currentVotes.stream().map(Vote::getUserId).toList();
        if (!userIds.isEmpty()) {
            List<User> users = userRepository.findAllById(userIds);
            users.forEach(u -> u.pointCurrentVoteTo(null));
        }

        // 엔티티 변경을 먼저 flush 후 벌크 UPDATE (clearAutomatically로 PC 초기화)
        voteRepository.archiveCurrentVotes(id);

        log.atInfo().addKeyValue("restaurantId", id).addKeyValue("archivedVotes", currentVotes.size())
                .log("가게 폐업");
        return CloseResponse.from(restaurant);
    }

    public RelocateResponse relocate(Long oldId, String newKakaoPlaceId) {
        for (int attempt = 1; attempt <= MAX_RETRY; attempt++) {
            try {
                return txTemplate.execute(status -> doRelocate(oldId, newKakaoPlaceId));
            } catch (OptimisticLockingFailureException ex) {
                if (attempt == MAX_RETRY) {
                    throw ex;
                }
                log.atWarn().addKeyValue("oldRestaurantId", oldId).addKeyValue("attempt", attempt)
                        .log("이전 낙관적 락 충돌");
            }
        }
        throw new IllegalStateException("unreachable");
    }

    private RelocateResponse doRelocate(Long oldId, String newKakaoPlaceId) {
        Restaurant oldRestaurant = findActiveOrThrow(oldId);

        if (oldRestaurant.getKakaoPlaceId().equals(newKakaoPlaceId)) {
            throw new DuplicatePlaceException(newKakaoPlaceId);
        }

        Restaurant newRestaurant = restaurantRepository.findByKakaoPlaceId(newKakaoPlaceId)
                .orElseThrow(() -> new NewPlaceNotFoundException(newKakaoPlaceId));
        if (newRestaurant.getStatus() != RestaurantStatus.ACTIVE) {
            throw new AlreadyClosedException(newRestaurant.getId());
        }

        List<Vote> currentVotes = voteRepository.findByRestaurantIdAndCurrentIsTrue(oldId);
        int movedVoteCount = currentVotes.size();
        List<Long> userIds = currentVotes.stream().map(Vote::getUserId).toList();

        oldRestaurant.adjustVoteCount(-movedVoteCount);
        newRestaurant.adjustVoteCount(movedVoteCount);
        oldRestaurant.relocateTo(newRestaurant);

        voteRepository.archiveCurrentVotes(oldId);

        List<Vote> newVotes = userIds.stream()
                .map(userId -> Vote.cast(userId, newRestaurant.getId(), Instant.now(clock)))
                .toList();
        voteRepository.saveAll(newVotes);
        voteRepository.flush();

        if (!userIds.isEmpty()) {
            Map<Long, User> userMap = userRepository.findAllById(userIds)
                    .stream().collect(Collectors.toMap(User::getId, Function.identity()));
            for (int i = 0; i < userIds.size(); i++) {
                User user = userMap.get(userIds.get(i));
                if (user != null) {
                    user.pointCurrentVoteTo(newVotes.get(i).getId());
                }
            }
        }

        log.atInfo().addKeyValue("oldRestaurantId", oldId)
                .addKeyValue("newRestaurantId", newRestaurant.getId())
                .addKeyValue("movedVotes", movedVoteCount).log("가게 이전");
        return new RelocateResponse(oldId, newRestaurant.getId(), movedVoteCount);
    }

    private Restaurant findActiveOrThrow(Long id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new RestaurantNotFoundException(id));
        if (restaurant.getStatus() != RestaurantStatus.ACTIVE) {
            throw new AlreadyClosedException(id);
        }
        return restaurant;
    }

    private long computeRank(int voteCount) {
        return restaurantQueryRepository.countWithVoteCountGreaterThan(voteCount) + 1;
    }
}
