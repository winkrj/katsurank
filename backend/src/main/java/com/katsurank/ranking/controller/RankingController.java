package com.katsurank.ranking.controller;

import com.katsurank.ranking.service.RankingService;
import com.katsurank.ranking.service.RankingSseService;

import com.katsurank.ranking.dto.MapPinResponse;

import com.katsurank.ranking.dto.RankingItem;
import com.katsurank.ranking.dto.TopRankingResult;

import com.katsurank.common.web.ApiResponse;
import com.katsurank.common.web.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

/** 서울 단일 랭킹 API. 전부 공개(GET permitAll), 인증 불필요. */
@RestController
@RequestMapping("/api/v1/ranking")
@Tag(name = "랭킹", description = "서울 단일 랭킹 조회")
public class RankingController {

    private final RankingService rankingService;
    private final RankingSseService rankingSseService;

    public RankingController(RankingService rankingService, RankingSseService rankingSseService) {
        this.rankingService = rankingService;
        this.rankingSseService = rankingSseService;
    }

    @GetMapping
    @Operation(summary = "랭킹 목록 조회", description = "vote_count DESC, status=ACTIVE 인 가게만 대상. offset/limit 페이지네이션.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "limit이 1~100 범위를 벗어남 (LIMIT_EXCEEDED)",
            content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    public ApiResponse<PageResponse<RankingItem>> ranking(
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "20") int limit) {
        return ApiResponse.success(rankingService.getRanking(offset, limit));
    }

    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "랭킹 변경 스트림", description = "투표가 반영되면 vote-changed 이벤트를 전송한다.")
    public ResponseEntity<SseEmitter> stream() {
        return ResponseEntity.ok()
                .header("X-Accel-Buffering", "no")
                .body(rankingSseService.connect());
    }

    @GetMapping("/top")
    @Operation(summary = "서울 1위(왕좌) 조회", description = "현재 랭킹 1위 가게 단건. 가게가 하나도 없으면 204 No Content.")
    public ResponseEntity<ApiResponse<RankingItem>> top() {
        return switch (rankingService.getTop()) {
            case TopRankingResult.Found(var item) -> ResponseEntity.ok(ApiResponse.success(item));
            case TopRankingResult.Empty ignored -> ResponseEntity.noContent().build();
        };
    }

    @GetMapping("/map-pins")
    @Operation(summary = "지도 핀용 가게 목록", description = "좌표가 있는 ACTIVE 가게 목록. 각 핀에 서울 전체 단일 랭킹 순위를 포함한다.")
    public ApiResponse<List<MapPinResponse>> mapPins() {
        return ApiResponse.success(rankingService.getMapPins());
    }
}
