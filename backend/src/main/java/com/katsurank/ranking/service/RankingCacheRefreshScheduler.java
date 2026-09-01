package com.katsurank.ranking.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.TriggerContext;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicLong;

/** 캐시 갱신 본체와 분리된 동적 fixed-delay 스케줄러. */
@Component
public class RankingCacheRefreshScheduler implements SchedulingConfigurer {

    static final long MINIMUM_DELAY_MILLIS = 10L;

    private final RankingService rankingService;
    private final AtomicLong refreshDelayMillis;

    public RankingCacheRefreshScheduler(
            RankingService rankingService,
            @Value("${ranking.cache.refresh-delay:1s}") Duration initialRefreshDelay) {
        this.rankingService = rankingService;
        this.refreshDelayMillis = new AtomicLong(validate(initialRefreshDelay.toMillis()));
    }

    @Override
    public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {
        taskRegistrar.addTriggerTask(rankingService::refreshRankingCache, this::nextExecution);
    }

    public long refreshDelayMillis() {
        return refreshDelayMillis.get();
    }

    public long updateRefreshDelay(long delayMillis) {
        refreshDelayMillis.set(validate(delayMillis));
        return delayMillis;
    }

    Instant nextExecution(TriggerContext context) {
        Instant lastCompletion = context.lastCompletion();
        if (lastCompletion == null) {
            return context.getClock().instant();
        }
        return lastCompletion.plusMillis(refreshDelayMillis.get());
    }

    private static long validate(long delayMillis) {
        if (delayMillis < MINIMUM_DELAY_MILLIS) {
            throw new IllegalArgumentException("랭킹 캐시 갱신 주기는 10ms 이상이어야 합니다.");
        }
        return delayMillis;
    }
}
