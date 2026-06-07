package com.katsurank.restaurant;

import java.util.List;

/**
 * 카카오 카테고리 화이트리스트 검증 (03 문서 6.2).
 *
 * <p>카카오 {@code category_name}(예: {@code "음식점 > 일식 > 돈까스,우동"})에
 * "돈까스"·"돈가스"·"경양식" 중 하나라도 포함되면 돈까스 가게로 인정한다.
 */
public final class CategoryValidator {

    private static final List<String> KEYWORDS = List.of("돈까스", "돈가스", "경양식");

    private CategoryValidator() {
    }

    public static boolean isTonkatsu(String kakaoCategory) {
        if (kakaoCategory == null) {
            return false;
        }
        return KEYWORDS.stream().anyMatch(kakaoCategory::contains);
    }
}
