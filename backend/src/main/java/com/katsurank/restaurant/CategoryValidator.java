package com.katsurank.restaurant;

import java.util.List;

/**
 * 카카오 카테고리 화이트리스트 검증 (03 문서 6.2).
 *
 * <p>카카오 {@code category_name}(예: {@code "음식점 > 일식 > 돈까스,우동"})에
 * "돈까스"·"돈가스"·"돈카츠"·"경양식" 중 하나라도 포함되면 돈까스 가게로 인정한다
 * ("돈카츠"는 "돈까스"의 흔한 표기 변형).
 *
 * <p>"일식" 같은 상위 카테고리 포괄 매칭은 의도적으로 배제한다 — 초밥·라멘 등
 * 돈까스와 무관한 업종까지 통과시키게 되므로 화이트리스트의 의미가 없어진다.
 */
public final class CategoryValidator {

    private static final List<String> KEYWORDS = List.of("돈까스", "돈가스", "돈카츠", "경양식");

    private CategoryValidator() {
    }

    public static boolean isTonkatsu(String kakaoCategory) {
        if (kakaoCategory == null) {
            return false;
        }
        return KEYWORDS.stream().anyMatch(kakaoCategory::contains);
    }
}
