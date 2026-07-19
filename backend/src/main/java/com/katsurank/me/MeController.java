package com.katsurank.me;

import com.katsurank.auth.AuthPrincipal;
import com.katsurank.auth.LoginUser;
import com.katsurank.common.web.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 마이페이지 API. 전부 로그인 필요. */
@RestController
@RequestMapping("/api/v1/me")
@Tag(name = "마이페이지", description = "내 정보 + 투표 히스토리")
public class MeController {

    private final MeService meService;

    public MeController(MeService meService) {
        this.meService = meService;
    }

    @GetMapping
    @Operation(summary = "내 정보 조회", description = "닉네임·프로필 이미지와 현재 1순위(투표 중인 가게)를 함께 반환한다.")
    @ApiResponse(responseCode = "401", description = "로그인 필요")
    public MeResponse me(@LoginUser AuthPrincipal principal) {
        return meService.getMe(principal.userId());
    }

    @GetMapping("/vote-history")
    @Operation(summary = "투표 히스토리 조회",
            description = "표를 던진 순서대로 이력을 반환한다(최신순). isCurrent=true인 항목이 현재 유효표. offset/limit 페이지네이션.")
    @ApiResponse(responseCode = "401", description = "로그인 필요")
    public PageResponse<VoteHistoryItem> voteHistory(
            @LoginUser AuthPrincipal principal,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "20") int limit) {
        return meService.getVoteHistory(principal.userId(), offset, limit);
    }
}
