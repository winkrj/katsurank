package com.katsurank.ranking.service;

import org.junit.jupiter.api.Test;
import org.springframework.scheduling.TriggerContext;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RankingCacheRefreshSchedulerTest {

    private static final Instant NOW = Instant.parse("2026-08-17T00:00:00Z");

    @Test
    void usesCurrentDelayAfterLastCompletion() {
        RankingCacheRefreshScheduler scheduler = new RankingCacheRefreshScheduler(
                mock(RankingService.class), Duration.ofSeconds(1));
        TriggerContext context = mock(TriggerContext.class);
        when(context.lastCompletion()).thenReturn(NOW);

        assertThat(scheduler.nextExecution(context)).isEqualTo(NOW.plusSeconds(1));

        scheduler.updateRefreshDelay(200);

        assertThat(scheduler.nextExecution(context)).isEqualTo(NOW.plusMillis(200));
        assertThat(scheduler.refreshDelayMillis()).isEqualTo(200);
    }

    @Test
    void firstExecutionIsImmediate() {
        RankingCacheRefreshScheduler scheduler = new RankingCacheRefreshScheduler(
                mock(RankingService.class), Duration.ofSeconds(1));
        TriggerContext context = mock(TriggerContext.class);
        when(context.getClock()).thenReturn(Clock.fixed(NOW, ZoneOffset.UTC));

        assertThat(scheduler.nextExecution(context)).isEqualTo(NOW);
    }

    @Test
    void rejectsBusyLoopDelay() {
        assertThatThrownBy(() -> new RankingCacheRefreshScheduler(
                mock(RankingService.class), Duration.ofMillis(9)))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
