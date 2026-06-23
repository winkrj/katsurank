package com.katsurank.kakao;

import jakarta.validation.constraints.NotBlank;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 카카오 로컬 API 프록시 — 가게 추가 화면에서 장소를 검색한다.
 * 결과를 {@code POST /api/v1/restaurants} 로 그대로 넘겨 등록한다.
 */
@RestController
@RequestMapping("/api/v1/kakao-places")
@Validated
public class KakaoController {

    private final KakaoLocalClient kakaoLocalClient;

    public KakaoController(KakaoLocalClient kakaoLocalClient) {
        this.kakaoLocalClient = kakaoLocalClient;
    }

    @GetMapping("/search")
    public List<KakaoPlace> search(@RequestParam @NotBlank String query) {
        return kakaoLocalClient.searchByKeyword(query.trim());
    }
}
