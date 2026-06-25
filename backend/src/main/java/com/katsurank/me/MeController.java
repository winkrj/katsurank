package com.katsurank.me;

import com.katsurank.auth.AuthPrincipal;
import com.katsurank.auth.LoginUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/me")
public class MeController {

    private final MeService meService;

    public MeController(MeService meService) {
        this.meService = meService;
    }

    @GetMapping
    public MeResponse me(@LoginUser AuthPrincipal principal) {
        return meService.getMe(principal.userId());
    }

    @GetMapping("/vote-history")
    public List<VoteHistoryItem> voteHistory(@LoginUser AuthPrincipal principal) {
        return meService.getVoteHistory(principal.userId());
    }
}
