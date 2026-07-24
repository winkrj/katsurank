package com.katsurank.ranking.dto;

import java.math.BigDecimal;

/** 지도 핀 응답을 만들기 위한 내부 조회 projection. */
public record MapPinRow(
        Long id,
        String name,
        BigDecimal latitude,
        BigDecimal longitude,
        int voteCount) {
}
