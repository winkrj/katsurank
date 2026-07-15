package com.katsurank.kakao;

import java.util.List;

/** {@code GET /api/v1/kakao-places/search} 응답. */
public record KakaoPlaceSearchResponse(
        List<KakaoPlace> places,
        int page,
        int totalPages,
        int totalCount,
        boolean isEnd) {

    public static KakaoPlaceSearchResponse of(KakaoSearchResult result, int page) {
        return new KakaoPlaceSearchResponse(
                result.places(), page, result.totalPages(), result.totalCount(), result.isEnd());
    }
}
