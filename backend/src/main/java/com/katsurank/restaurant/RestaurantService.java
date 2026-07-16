package com.katsurank.restaurant;

import com.katsurank.user.User;
import com.katsurank.user.UserRepository;
import com.katsurank.vote.Vote;
import com.katsurank.vote.VoteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public RestaurantService(RestaurantRepository restaurantRepository,
                             RestaurantQueryRepository restaurantQueryRepository,
                             VoteRepository voteRepository,
                             UserRepository userRepository) {
        this.restaurantRepository = restaurantRepository;
        this.restaurantQueryRepository = restaurantQueryRepository;
        this.voteRepository = voteRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public RestaurantResponse register(RestaurantRegisterRequest request, Long userId) {
        if (restaurantRepository.existsByKakaoPlaceId(request.kakaoPlaceId())) {
            throw new DuplicatePlaceException(request.kakaoPlaceId());
        }
        if (!CategoryValidator.isTonkatsu(request.kakaoCategory())) {
            throw new CategoryNotAllowedException(request.kakaoCategory());
        }
        if (!SeoulAddressValidator.isSeoul(request.address(), request.roadAddress())) {
            throw new RegionNotAllowedException(request.address());
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

    @Transactional
    public CloseResponse close(Long id) {
        Restaurant restaurant = findActiveOrThrow(id);
        restaurant.close();

        List<Vote> currentVotes = voteRepository.findByRestaurantIdAndCurrentIsTrue(id);
        List<Long> userIds = currentVotes.stream().map(Vote::getUserId).toList();
        if (!userIds.isEmpty()) {
            List<User> users = userRepository.findAllById(userIds);
            users.forEach(u -> u.pointCurrentVoteTo(null));
        }

        // 엔티티 변경을 먼저 flush 후 벌크 UPDATE (clearAutomatically로 PC 초기화)
        voteRepository.archiveCurrentVotes(id);

        log.info("가게 폐업 id={} archivedVotes={}", id, currentVotes.size());
        return CloseResponse.from(restaurant);
    }

    public RelocateResponse relocate(Long oldId, RelocateRequest request) {
        for (int attempt = 1; attempt <= MAX_RETRY; attempt++) {
            try {
                return doRelocate(oldId, request);
            } catch (OptimisticLockingFailureException ex) {
                if (attempt == MAX_RETRY) {
                    throw ex;
                }
                log.warn("이전 낙관적 락 충돌 oldId={} attempt={}", oldId, attempt);
            }
        }
        throw new IllegalStateException("unreachable");
    }

    @Transactional
    protected RelocateResponse doRelocate(Long oldId, RelocateRequest request) {
        Restaurant oldRestaurant = findActiveOrThrow(oldId);

        if (oldRestaurant.getKakaoPlaceId().equals(request.newKakaoPlaceId())) {
            throw new DuplicatePlaceException(request.newKakaoPlaceId());
        }

        Restaurant newRestaurant = restaurantRepository.findByKakaoPlaceId(request.newKakaoPlaceId())
                .orElseThrow(() -> new NewPlaceNotFoundException(request.newKakaoPlaceId()));
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
                .map(userId -> Vote.cast(userId, newRestaurant.getId()))
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

        log.info("가게 이전 oldId={} newId={} movedVotes={}", oldId, newRestaurant.getId(), movedVoteCount);
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
