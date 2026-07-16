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

    /**
     * 서울 전체를 넉넉히 덮는 사각 영역(좌하x,좌하y,우상x,우상y) — 카카오 {@code rect} 파라미터로
     * 부산·제주 등 서울과 무관한 결과를 API 호출 단계에서부터 줄인다. 사각형이라 서울 경계와 딱 맞지
     * 않고 인접 경기·인천 일부가 걸치므로, 최종 판단은 아래 {@link #isInSeoul}(주소 접두어)이 한다.
     */
    private static final String SEOUL_RECT = "126.734086,37.413294,127.269311,37.715133";

    private static final String SEOUL_PREFIX = "서울";

    /**
     * 카카오는 돈까스집을 항상 {@code category_name}에 "돈까스"를 포함해 분류한다(예: "일식 > 돈까스,우동").
     * "경양식"은 실제 카카오 분류 체계에 존재하지 않는 카테고리라 여기엔 넣지 않는다 — 진짜 경양식 돈까스집도
     * 카카오는 그냥 "음식점 > 양식"으로만 태깅해버려서, category_name 매칭만으로는 절대 걸리지 않는다.
     */
    private static final List<String> CATEGORY_KEYWORDS = List.of("돈까스", "돈가스", "돈카츠");

    /**
     * category_name 매칭에서 빠지는 가게(위 사례처럼 "음식점 > 양식"으로만 태깅된 경우)를
     * 놓치지 않기 위한 보조 시그널. 검색 단계는 등록 단계({@link com.katsurank.restaurant.CategoryValidator})보다
     * 느슨하게 걸러 재현율을 우선한다 — 최종 판단은 어차피 등록 시점에 한 번 더 걸린다.
     */
    private static final List<String> NAME_KEYWORDS = List.of("돈까스", "돈가스", "돈카츠", "카츠", "경양식");

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
                            .queryParam("rect", SEOUL_RECT)
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
        List<KakaoPlace> places = response.toPlaces().stream()
                .filter(KakaoLocalClient::isInSeoul)
                .filter(KakaoLocalClient::isLikelyTonkatsu)
                .toList();
        // totalCount/totalPages/isEnd 는 필터링 전 카카오 원본 페이지 기준 — 위 places 개수와 정확히 일치하지 않을 수 있다.
        return new KakaoSearchResult(
                places, meta.totalCount(), calculateTotalPages(meta.pageableCount()), meta.isEnd());
    }

    private static boolean isInSeoul(KakaoPlace place) {
        if (place.address() != null && place.address().startsWith(SEOUL_PREFIX)) {
            return true;
        }
        return place.roadAddress() != null && place.roadAddress().startsWith(SEOUL_PREFIX);
    }

    private static boolean isLikelyTonkatsu(KakaoPlace place) {
        if (containsAny(place.category(), CATEGORY_KEYWORDS)) {
            return true;
        }
        return containsAny(place.name(), NAME_KEYWORDS);
    }

    private static boolean containsAny(String text, List<String> keywords) {
        return text != null && keywords.stream().anyMatch(text::contains);
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
