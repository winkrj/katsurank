package com.katsurank.ranking;

import com.katsurank.common.web.ApiError;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** 서울 단일 랭킹 API. 전부 공개(GET permitAll), 인증 불필요. */
@RestController
@RequestMapping("/api/v1/ranking")
@Tag(name = "랭킹", description = "서울 단일 랭킹 조회")
public class RankingController {

    private final RankingService rankingService;

    public RankingController(RankingService rankingService) {
        this.rankingService = rankingService;
    }

    @GetMapping
    @Operation(summary = "랭킹 목록 조회", description = "vote_count DESC, status=ACTIVE 인 가게만 대상. offset/limit 페이지네이션.")
    @ApiResponse(responseCode = "400", description = "limit이 1~100 범위를 벗어남 (LIMIT_EXCEEDED)",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public RankingResponse ranking(
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        return rankingService.getRanking(offset, limit);
    }

    @GetMapping("/top")
    @Operation(summary = "서울 1위(왕좌) 조회", description = "현재 랭킹 1위 가게 단건. 가게가 하나도 없으면 204 No Content.")
    public ResponseEntity<RankingItem> top() {
        return rankingService.getTop()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/map-pins")
    @Operation(summary = "지도 핀용 가게 목록", description = "status=ACTIVE 인 가게의 좌표 목록. 지도에 마커를 찍는 용도.")
    public List<MapPinResponse> mapPins() {
        return rankingService.getMapPins();
    }
}
