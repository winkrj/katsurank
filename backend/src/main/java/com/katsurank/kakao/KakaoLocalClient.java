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

    @Cacheable(cacheNames = "kakaoPlaceSearch", key = "#query + '_' + #page")
    public KakaoSearchResult searchByKeyword(String query, int page) {
        log.info("카카오 로컬 검색 호출 query={} page={}", query, page);
        try {
            KakaoKeywordSearchResponse response = restClient.get()
                    .uri(uri -> uri.path("/v2/local/search/keyword.json")
                            .queryParam("query", query)
                            .queryParam("page", page)
                            .queryParam("size", SEARCH_SIZE)
                            .queryParam("category_group_code", FOOD_CATEGORY_GROUP)
                            .build())
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        throw new KakaoApiException("카카오 로컬 API 응답 오류: " + res.getStatusCode());
                    })
                    .body(KakaoKeywordSearchResponse.class);

            return toSearchResult(response);
        } catch (RestClientException ex) {
            throw new KakaoApiException("카카오 로컬 API 호출 실패: " + ex.getMessage());
        }
    }

    private static KakaoSearchResult toSearchResult(KakaoKeywordSearchResponse response) {
        if (response == null || response.meta() == null) {
            return new KakaoSearchResult(List.of(), 0, 0, true);
        }
        KakaoKeywordSearchResponse.Meta meta = response.meta();
        return new KakaoSearchResult(
                response.toPlaces(), meta.totalCount(), calculateTotalPages(meta.pageableCount()), meta.isEnd());
    }

    /** 카카오가 실제 열람을 허용하는 건수({@code pageable_count}, 최대 45) 기준으로 계산한다.
     * {@code total_count} 기준으로 계산하면 실제로는 존재하지 않는 페이지 번호가 나올 수 있다. */
    private static int calculateTotalPages(int pageableCount) {
        if (pageableCount <= 0) {
            return 0;
        }
        return (int) Math.ceil((double) pageableCount / SEARCH_SIZE);
    }
}
