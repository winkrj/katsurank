package com.katsurank.ranking.controller;

import com.katsurank.common.web.ApiResponse;
import com.katsurank.ranking.dto.RankingHistoryItem;
import com.katsurank.ranking.service.RankingHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/restaurants/{restaurantId}/ranking-history")
@Tag(name = "랭킹", description = "서울 단일 랭킹 조회")
public class RestaurantRankingHistoryController {

    private final RankingHistoryService rankingHistoryService;

    public RestaurantRankingHistoryController(RankingHistoryService rankingHistoryService) {
        this.rankingHistoryService = rankingHistoryService;
    }

    @GetMapping
    @Operation(summary = "가게 최근 7일 순위 이력",
            description = "KST 일별 스냅샷 중 최근 7건을 날짜 오름차순으로 반환한다. 인증은 필요하지 않다.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404",
            description = "존재하지 않는 가게(RESTAURANT_NOT_FOUND)",
            content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    public ApiResponse<List<RankingHistoryItem>> getHistory(@PathVariable Long restaurantId) {
        return ApiResponse.success(rankingHistoryService.getHistory(restaurantId));
    }
}
