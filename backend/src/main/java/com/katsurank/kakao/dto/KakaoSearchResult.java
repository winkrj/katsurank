package com.katsurank.kakao.dto;

import java.util.List;

/**
 * 카카오 로컬 검색 클라이언트 호출 결과 — 서울·돈까스 필터를 통과한 place 목록(요청한
 * offset/limit로 슬라이싱된 상태)과 필터링 후 전체 개수를 담는다.
 */
public record KakaoSearchResult(
        List<KakaoPlace> places,
        int totalCount) {
}
