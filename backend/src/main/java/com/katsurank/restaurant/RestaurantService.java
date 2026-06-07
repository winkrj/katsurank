package com.katsurank.restaurant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 가게 등록·조회 서비스. 트랜잭션 경계는 이 계층.
 *
 * <p>등록 정책(03 문서 3장 · 6.2):
 * <ul>
 *   <li>{@code kakao_place_id} 중복 차단(애플리케이션 + DB UNIQUE 이중 방어).</li>
 *   <li>카테고리 화이트리스트(돈까스/돈가스/경양식) 미달이면 거부({@link CategoryNotAllowedException}, 422)하고
 *       <b>영속하지 않는다</b> — 사용자에게 즉시 사유를 안내하고 place_id 를 영구히 막지 않기 위함.</li>
 * </ul>
 * 투표·랭킹·폐업/이전 로직은 후속 작업.
 */
@Service
public class RestaurantService {

    private static final Logger log = LoggerFactory.getLogger(RestaurantService.class);

    private final RestaurantRepository restaurantRepository;

    public RestaurantService(RestaurantRepository restaurantRepository) {
        this.restaurantRepository = restaurantRepository;
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

        Restaurant saved = restaurantRepository.save(restaurant);
        log.info("가게 등록 id={} status={} kakaoPlaceId={} by userId={}",
                saved.getId(), saved.getStatus(), saved.getKakaoPlaceId(), userId);
        return RestaurantResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public RestaurantResponse getById(Long id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new RestaurantNotFoundException(id));
        return RestaurantResponse.from(restaurant);
    }
}
