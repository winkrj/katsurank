package com.katsurank.ranking.dto;

import java.time.Instant;
import java.util.List;

/** SSE로 전파하는 서울 TOP 20 전체 스냅샷. */
public record RankingSnapshotEvent(
        long version,
        Instant changedAt,
        Instant generatedAt,
        List<RankingItem> items) {

    public RankingSnapshotEvent {
        items = List.copyOf(items);
    }
}
