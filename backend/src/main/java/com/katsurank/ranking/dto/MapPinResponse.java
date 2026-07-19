package com.katsurank.ranking.dto;

import java.math.BigDecimal;

public record MapPinResponse(
        Long id,
        String name,
        BigDecimal latitude,
        BigDecimal longitude,
        int voteCount) {
}
