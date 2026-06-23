package com.katsurank.kakao;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.web.client.RestClient;

/** 카카오 로컬 API 전용 {@link RestClient} (베이스 URL + 인증 헤더 고정). */
@Configuration
@EnableConfigurationProperties(KakaoProperties.class)
public class KakaoConfig {

    @Bean
    public RestClient kakaoLocalRestClient(KakaoProperties properties) {
        return RestClient.builder()
                .baseUrl(properties.localApiBaseUrl())
                .defaultHeader(HttpHeaders.AUTHORIZATION, "KakaoAK " + properties.restApiKey())
                .build();
    }
}
