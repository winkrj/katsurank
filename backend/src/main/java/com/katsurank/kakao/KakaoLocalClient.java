package com.katsurank.kakao;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * 카카오 로컬 API 키워드 검색 — 서울·돈까스 관련 결과만 골라 우리 쪽 페이지 단위(15건)로 다시 나눈다.
 *
 * <p>카카오는 원본 페이지를 최대 3장(45건)까지만 열람을 허용한다. 그 45건 중 서울·돈까스 필터를
 * 통과하는 것만 추려야 하므로, 클라이언트가 요청한 offset/limit을 카카오 원본 {@code page} 파라미터에
 * 그대로 대응시키면 안 된다 — 카카오 1페이지에서 걸러지고 남은 게 2건뿐이어도 2페이지엔 우리가 찾는
 * 진짜 돈까스집이 더 있을 수 있다. 그래서 원본 1~3페이지를 전부 모아 필터링한 뒤, 그 결과를 요청받은
 * offset/limit로 다시 슬라이싱해 돌려준다.
 *
 * <p>가게 등록 시에만 호출하고, 원본 페이지 호출 자체는 {@link KakaoRawPageFetcher}가 캐싱해
 * 재사용한다(03 문서 6.4). 등록 이후 조회는 자체 DB가 담당한다.
 */
@Component
public class KakaoLocalClient {

    private static final Logger log = LoggerFactory.getLogger(KakaoLocalClient.class);

    /** 카카오 정책상 page*size&lt;=45 — 원본 페이지는 최대 3장까지만 열람 가능하다. */
    private static final int MAX_RAW_PAGES = 3;

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

    private final KakaoRawPageFetcher rawPageFetcher;

    public KakaoLocalClient(KakaoRawPageFetcher rawPageFetcher) {
        this.rawPageFetcher = rawPageFetcher;
    }

    public KakaoSearchResult searchByKeyword(String query, int offset, int limit) {
        log.info("카카오 로컬 검색 호출 query={} offset={} limit={}", query, offset, limit);
        List<KakaoPlace> filtered = fetchAllFiltered(query);
        return paginate(filtered, offset, limit);
    }

    /** 원본 1~3페이지를 카카오가 isEnd라고 할 때까지(또는 3페이지까지) 모아 서울·돈까스 필터를 적용한다. */
    private List<KakaoPlace> fetchAllFiltered(String query) {
        List<KakaoPlace> merged = new ArrayList<>();
        for (int rawPage = 1; rawPage <= MAX_RAW_PAGES; rawPage++) {
            KakaoKeywordSearchResponse response = rawPageFetcher.fetch(query, rawPage);
            if (response == null || response.meta() == null) {
                break;
            }
            merged.addAll(response.toPlaces());
            if (response.meta().isEnd()) {
                break;
            }
        }
        return merged.stream()
                .filter(KakaoLocalClient::isInSeoul)
                .filter(KakaoLocalClient::isLikelyTonkatsu)
                .toList();
    }

    private static KakaoSearchResult paginate(List<KakaoPlace> filtered, int offset, int limit) {
        int totalCount = filtered.size();
        int fromIndex = Math.min(offset, totalCount);
        int toIndex = Math.min(fromIndex + limit, totalCount);
        return new KakaoSearchResult(filtered.subList(fromIndex, toIndex), totalCount);
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
}
