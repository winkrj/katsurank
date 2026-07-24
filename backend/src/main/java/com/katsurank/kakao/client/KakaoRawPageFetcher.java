package com.katsurank.kakao.client;

import com.katsurank.kakao.dto.KakaoKeywordSearchResponse;

import com.katsurank.kakao.exception.KakaoApiException;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * 카카오 로컬 API 원본 페이지 호출 + 캐싱 전담.
 *
 * <p>{@link KakaoLocalClient}가 서울·돈까스 필터를 통과하는 결과를 모으려고 원본 페이지를 여러 번
 * 순회하며 호출한다. 같은 클래스 안에서 {@code @Cacheable} 메서드를 {@code this}로 직접 호출하면
 * Spring AOP 프록시를 우회해 캐싱이 동작하지 않으므로(self-invocation 문제), 캐싱 대상 호출을
 * 별도 빈으로 분리했다.
 */
@Component
public class KakaoRawPageFetcher {

    static final int SEARCH_SIZE = 15;

    /** 음식점 카테고리 그룹 코드 — 검색 노이즈를 줄인다. */
    private static final String FOOD_CATEGORY_GROUP = "FD6";

    /**
     * 서울 전체를 넉넉히 덮는 사각 영역(좌하x,좌하y,우상x,우상y) — 카카오 {@code rect} 파라미터로
     * 부산·제주 등 서울과 무관한 결과를 API 호출 단계에서부터 줄인다. 사각형이라 서울 경계와 딱 맞지
     * 않고 인접 경기·인천 일부가 걸치므로, 최종 판단은 {@link KakaoLocalClient#isInSeoul}(주소 접두어)이 한다.
     */
    private static final String SEOUL_RECT = "126.734086,37.413294,127.269311,37.715133";

    private final RestClient restClient;

    public KakaoRawPageFetcher(@Qualifier("kakaoLocalRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    /**
     * public이어야 한다 — Spring의 기본 프록시 기반 캐싱은 {@code @Cacheable}을 public 메서드에서만
     * 인식한다({@code AnnotationCacheOperationSource}가 public 메서드만 캐시 대상으로 스캔). package-private로
     * 두면 예외 없이 조용히 캐싱이 적용되지 않아 매 호출이 카카오 API를 실제로 때린다.
     */
    @Cacheable(cacheNames = "kakaoPlaceSearch", key = "#query + '_' + #rawPage")
    public KakaoKeywordSearchResponse fetch(String query, int rawPage) {
        try {
            return restClient.get()
                    .uri(uri -> uri.path("/v2/local/search/keyword.json")
                            .queryParam("query", query)
                            .queryParam("page", rawPage)
                            .queryParam("size", SEARCH_SIZE)
                            .queryParam("category_group_code", FOOD_CATEGORY_GROUP)
                            .queryParam("rect", SEOUL_RECT)
                            .build())
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        throw new KakaoApiException("카카오 로컬 API 응답 오류: " + res.getStatusCode());
                    })
                    .body(KakaoKeywordSearchResponse.class);
        } catch (RestClientException ex) {
            throw new KakaoApiException("카카오 로컬 API 호출 실패: " + ex.getMessage(), ex);
        }
    }
}
