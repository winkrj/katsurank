package com.katsurank.ranking.controller;

import com.katsurank.ranking.service.RankingCacheRefreshScheduler;
import org.springframework.boot.actuate.endpoint.annotation.Endpoint;
import org.springframework.boot.actuate.endpoint.annotation.ReadOperation;
import org.springframework.boot.actuate.endpoint.annotation.WriteOperation;
import org.springframework.stereotype.Component;

/** 명시적으로 노출한 측정 실행에서만 사용하는 캐시 주기 Actuator endpoint. */
@Component
@Endpoint(id = "rankingcache")
public class RankingCacheEndpoint {

    private final RankingCacheRefreshScheduler scheduler;

    public RankingCacheEndpoint(RankingCacheRefreshScheduler scheduler) {
        this.scheduler = scheduler;
    }

    @ReadOperation
    public CacheSchedule current() {
        return new CacheSchedule(scheduler.refreshDelayMillis());
    }

    @WriteOperation
    public CacheSchedule update(long refreshDelayMillis) {
        return new CacheSchedule(scheduler.updateRefreshDelay(refreshDelayMillis));
    }

    public record CacheSchedule(long refreshDelayMillis) {
    }
}
