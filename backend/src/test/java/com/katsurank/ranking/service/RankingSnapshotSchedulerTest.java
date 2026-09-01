package com.katsurank.ranking.service;

import org.junit.jupiter.api.Test;
import org.springframework.scheduling.annotation.Scheduled;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class RankingSnapshotSchedulerTest {

    @Test
    void delegatesAtKstMidnight() throws Exception {
        RankingHistoryService service = mock(RankingHistoryService.class);
        RankingSnapshotScheduler scheduler = new RankingSnapshotScheduler(service);

        scheduler.captureDailySnapshot();

        verify(service).captureDailySnapshot();
        Method method = RankingSnapshotScheduler.class.getMethod("captureDailySnapshot");
        Scheduled scheduled = method.getAnnotation(Scheduled.class);
        assertThat(scheduled.cron()).isEqualTo("0 0 0 * * *");
        assertThat(scheduled.zone()).isEqualTo("Asia/Seoul");
    }
}
