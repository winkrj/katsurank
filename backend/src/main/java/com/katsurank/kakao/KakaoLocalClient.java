package com.katsurank.kakao;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

/**
 * 카카오 로컬 API 키워드 검색 클라이언트.
 *
 * <p>가게 등록 시에만 호출하고, 동일 질의는 Caffeine 캐시({@code kakaoPlaceSearch})로 응답을 재사용해
 * 외부 호출을 줄인다(03 문서 6.4). 등록 이후 조회는 자체 DB 가 담당한다.
 */
@Component
public class KakaoLocalClient {

    private static final Logger log = LoggerFactory.getLogger(KakaoLocalClient.class);

    /** 음식점 카테고리 그룹 코드 — 검색 노이즈를 줄인다. */
    private static final String FOOD_CATEGORY_GROUP = "FD6";
    private static final int SEARCH_SIZE = 15;

    private final RestClient restClient;

    public KakaoLocalClient(@Qualifier("kakaoLocalRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    @Cacheable(cacheNames = "kakaoPlaceSearch", key = "#query")
    public List<KakaoPlace> searchByKeyword(String query) {
        log.info("카카오 로컬 검색 호출 query={}", query);
        try {
            KakaoKeywordSearchResponse response = restClient.get()
                    .uri(uri -> uri.path("/v2/local/search/keyword.json")
                            .queryParam("query", query)
                            .queryParam("size", SEARCH_SIZE)
                            .queryParam("category_group_code", FOOD_CATEGORY_GROUP)
                            .build())
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        throw new KakaoApiException("카카오 로컬 API 응답 오류: " + res.getStatusCode());
                    })
                    .body(KakaoKeywordSearchResponse.class);

            return response == null ? List.of() : response.toPlaces();
        } catch (RestClientException ex) {
            throw new KakaoApiException("카카오 로컬 API 호출 실패: " + ex.getMessage());
        }
    }
}
