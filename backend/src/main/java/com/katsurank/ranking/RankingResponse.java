package com.katsurank.ranking;

import java.util.List;

public record RankingResponse(
        List<RankingItem> items,
        long total,
        int offset,
        int limit) {
}
