package com.katsurank.ranking.controller;

import com.katsurank.ranking.service.RankingCacheRefreshScheduler;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RankingCacheEndpointTest {

    @Test
    void readsAndUpdatesRefreshDelay() {
        RankingCacheRefreshScheduler scheduler = mock(RankingCacheRefreshScheduler.class);
        RankingCacheEndpoint endpoint = new RankingCacheEndpoint(scheduler);
        when(scheduler.refreshDelayMillis()).thenReturn(1_000L);
        when(scheduler.updateRefreshDelay(200)).thenReturn(200L);

        assertThat(endpoint.current().refreshDelayMillis()).isEqualTo(1_000L);
        assertThat(endpoint.update(200).refreshDelayMillis()).isEqualTo(200L);
        verify(scheduler).updateRefreshDelay(200);
    }
}
