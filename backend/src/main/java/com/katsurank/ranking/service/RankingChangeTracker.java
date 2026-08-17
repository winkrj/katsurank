package com.katsurank.ranking.service;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

/** 캐시 갱신을 당기지 않고, 최근 투표 커밋 시각만 다음 스냅샷 갱신에 전달한다. */
@Component
public class RankingChangeTracker {

    private final AtomicLong sequence = new AtomicLong();
    private final AtomicReference<ChangeMarker> latest = new AtomicReference<>();

    public void markCommitted(Instant committedAt) {
        latest.set(new ChangeMarker(sequence.incrementAndGet(), committedAt));
    }

    ChangeMarker current() {
        return latest.get();
    }

    void clear(ChangeMarker marker) {
        if (marker != null) {
            latest.compareAndSet(marker, null);
        }
    }

    record ChangeMarker(long sequence, Instant committedAt) {
    }
}
