package com.katsurank.vote;

import com.katsurank.auth.AuthPrincipal;
import com.katsurank.auth.LoginUser;
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
public class VoteController {

    private final VoteService voteService;

    public VoteController(VoteService voteService) {
        this.voteService = voteService;
    }

    @PostMapping
    public VoteResponse vote(@Valid @RequestBody VoteRequest request, @LoginUser AuthPrincipal principal) {
        return voteService.vote(principal.userId(), request.restaurantId());
    }
}
