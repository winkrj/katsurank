package com.katsurank.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

/**
 * 캐시 활성화. CacheManager 는 application.yml({@code spring.cache.caffeine.*}) 기반으로
 * Spring Boot 가 Caffeine 으로 자동 구성한다. 현재 캐시: {@code kakaoPlaceSearch}.
 */
@Configuration
@EnableCaching
public class CacheConfig {
}
