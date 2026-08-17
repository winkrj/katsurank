package com.katsurank.ranking.service;

import com.katsurank.ranking.dto.RankingRow;
import com.katsurank.ranking.dto.RankingSnapshotEvent;
import com.katsurank.ranking.repository.RankingQueryRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RankingCacheBroadcastTest {

    @Test
    void broadcastsOnlyWhenTopTwentyChanges() {
        RankingQueryRepository repository = mock(RankingQueryRepository.class);
        RankingSseService sseService = mock(RankingSseService.class);
        RankingChangeTracker changeTracker = new RankingChangeTracker();
        Clock clock = Clock.fixed(Instant.parse("2026-08-17T00:00:01Z"), ZoneOffset.UTC);
        RankingService service = new RankingService(repository, new SimpleMeterRegistry(), sseService,
                changeTracker, clock, true);
        when(repository.countActiveRestaurants()).thenReturn(1L);
        when(repository.countWithVoteCountGreaterThan(anyInt())).thenReturn(0L);
        doReturn(List.of(row(10)), List.of(row(10)), List.of(row(11)))
                .when(repository).findActiveRanking(0, 20);

        changeTracker.markCommitted(Instant.parse("2026-08-17T00:00:00Z"));
        service.refreshRankingCache();
        service.refreshRankingCache();
        changeTracker.markCommitted(Instant.parse("2026-08-17T00:00:02Z"));
        service.refreshRankingCache();

        ArgumentCaptor<RankingSnapshotEvent> event = ArgumentCaptor.forClass(RankingSnapshotEvent.class);
        verify(sseService, times(2)).broadcast(event.capture());
        assertThat(event.getAllValues()).extracting(RankingSnapshotEvent::version).containsExactly(1L, 2L);
        assertThat(event.getAllValues().get(1).items().getFirst().voteCount()).isEqualTo(11);
        assertThat(event.getAllValues().get(1).changedAt())
                .isEqualTo(Instant.parse("2026-08-17T00:00:02Z"));
    }

    private RankingRow row(int voteCount) {
        return new RankingRow(1L, "가게", "서울", null, null, voteCount, null);
    }
}
