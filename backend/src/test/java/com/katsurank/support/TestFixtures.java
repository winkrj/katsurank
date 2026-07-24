package com.katsurank.support;

import com.katsurank.restaurant.Restaurant;
import com.katsurank.restaurant.repository.RestaurantRepository;
import com.katsurank.user.User;
import com.katsurank.user.repository.UserRepository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

public final class TestFixtures {

    private TestFixtures() {
    }

    public static User createUser(UserRepository userRepository) {
        long kakaoId = ThreadLocalRandom.current().nextLong(1, Long.MAX_VALUE);
        return userRepository.save(User.register(kakaoId, "tester-" + kakaoId, null, java.time.Instant.EPOCH));
    }

    public static List<User> createUsers(UserRepository userRepository, int count) {
        List<User> users = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            users.add(createUser(userRepository));
        }
        return users;
    }

    public static Restaurant createRestaurant(RestaurantRepository restaurantRepository) {
        return createRestaurant(restaurantRepository, "테스트돈까스");
    }

    public static Restaurant createRestaurant(RestaurantRepository restaurantRepository, String name) {
        return restaurantRepository.save(Restaurant.register(
                "test-" + UUID.randomUUID(), name, "서울 어딘가", "서울 어딘가로 1",
                new BigDecimal("37.5000000"), new BigDecimal("127.0000000"),
                "음식점 > 일식 > 돈까스,우동", null, "https://place.map.kakao.com/test", null));
    }

    public static Restaurant createRestaurantNoCoords(RestaurantRepository restaurantRepository, String name) {
        return restaurantRepository.save(Restaurant.register(
                "test-" + UUID.randomUUID(), name, "서울 어딘가", null,
                null, null,
                "음식점 > 일식 > 돈까스,우동", null, null, null));
    }

    public static Restaurant createClosedRestaurant(RestaurantRepository restaurantRepository, String name) {
        Restaurant r = Restaurant.register(
                "test-closed-" + UUID.randomUUID(), name, null, null, null, null,
                "음식점 > 일식 > 돈까스,우동", null, null, null);
        r.close(java.time.Instant.EPOCH);
        return restaurantRepository.save(r);
    }
}
