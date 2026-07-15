package com.katsurank.kakao;

import java.util.List;

/**
 * 카카오 로컬 검색 클라이언트 호출 결과 — place 목록과 페이지 메타를 함께 담는다.
 *
 * <p>요청한 {@code page} 번호는 호출자가 이미 알고 있으므로 여기엔 담지 않는다.
 */
public record KakaoSearchResult(
        List<KakaoPlace> places,
        int totalCount,
        int totalPages,
        boolean isEnd) {
}
