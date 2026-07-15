package com.katsurank.restaurant;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class CategoryValidatorTest {

    @ParameterizedTest
    @ValueSource(strings = {
            "음식점 > 일식 > 돈까스,우동",
            "음식점 > 양식 > 경양식",
            "음식점 > 한식 > 돈가스",
            "음식점 > 일식 > 돈카츠",
            "음식점 > 양식 > 돈카츠 전문점"
    })
    void 화이트리스트_키워드를_포함하면_true(String category) {
        assertThat(CategoryValidator.isTonkatsu(category)).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "음식점 > 일식 > 초밥,롤",
            "음식점 > 일식 > 라멘",
            "음식점 > 분식",
            "카페 > 디저트",
            "음식점 > 양식 > 커틀릿"
    })
    void 화이트리스트에_없으면_false(String category) {
        assertThat(CategoryValidator.isTonkatsu(category)).isFalse();
    }

    @ParameterizedTest
    @NullSource
    void null_이면_false(String category) {
        assertThat(CategoryValidator.isTonkatsu(category)).isFalse();
    }
}
