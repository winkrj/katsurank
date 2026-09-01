package com.katsurank.ranking.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class RankingSnapshotScheduler {

    private static final Logger log = LoggerFactory.getLogger(RankingSnapshotScheduler.class);

    private final RankingHistoryService rankingHistoryService;

    public RankingSnapshotScheduler(RankingHistoryService rankingHistoryService) {
        this.rankingHistoryService = rankingHistoryService;
    }

    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Seoul")
    public void captureDailySnapshot() {
        int inserted = rankingHistoryService.captureDailySnapshot();
        log.atInfo().addKeyValue("inserted", inserted).log("일별 랭킹 스냅샷 저장");
    }
}
