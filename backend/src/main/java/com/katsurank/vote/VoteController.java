package com.katsurank.vote;

import com.katsurank.auth.AuthPrincipal;
import com.katsurank.auth.LoginUser;
import com.katsurank.common.web.ApiError;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 투표 API. 로그인 필요(SecurityConfig 의 anyRequest authenticated).
 * 처음 찍기와 표 이동을 한 엔드포인트가 처리한다.
 */
@RestController
@RequestMapping("/api/v1/votes")
@Tag(name = "투표", description = "1인 1표 투표 / 표 이동")
public class VoteController {

    private final VoteService voteService;

    public VoteController(VoteService voteService) {
        this.voteService = voteService;
    }

    @PostMapping
    @Operation(summary = "투표 / 표 이동",
            description = "로그인 유저가 restaurantId에 표를 던진다. 이미 다른 가게에 투표한 상태면 표가 이동한다. "
                    + "로그인 세션과 CSRF 헤더(X-XSRF-TOKEN)가 필요하다.")
    @ApiResponse(responseCode = "200", description = "투표(이동) 성공")
    @ApiResponse(responseCode = "401", description = "로그인 필요")
    @ApiResponse(responseCode = "404", description = "존재하지 않는 restaurantId",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "ACTIVE 가 아닌 가게에 투표 시도(RESTAURANT_NOT_VOTABLE) 또는 동시성 경합 재시도 초과(VOTE_CONFLICT)",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @Parameter(name = "X-XSRF-TOKEN", in = ParameterIn.HEADER, required = true,
            description = "GET /api/v1/auth/csrf 응답의 token 값을 그대로 넣는다. Swagger \"Try it out\"에서 "
                    + "이 필드가 비어 있으면 요청 자체가 CSRF 검증에서 403으로 막힌다.")
    public VoteResponse vote(@Valid @RequestBody VoteRequest request, @LoginUser AuthPrincipal principal) {
        return voteService.vote(principal.userId(), request.restaurantId());
    }
}
