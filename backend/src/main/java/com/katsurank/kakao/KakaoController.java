package com.katsurank.kakao;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 카카오 로컬 API 프록시 — 가게 추가 화면에서 장소를 검색한다.
 * 결과를 {@code POST /api/v1/restaurants} 로 그대로 넘겨 등록한다.
 */
@RestController
@RequestMapping("/api/v1/kakao-places")
@Validated
@Tag(name = "카카오 장소 검색", description = "가게 등록 전 카카오 로컬 API로 장소를 검색하는 프록시")
public class KakaoController {

    private final KakaoLocalClient kakaoLocalClient;

    public KakaoController(KakaoLocalClient kakaoLocalClient) {
        this.kakaoLocalClient = kakaoLocalClient;
    }

    @GetMapping("/search")
    @Operation(summary = "카카오 장소 키워드 검색",
            description = "카카오 로컬 API를 그대로 프록시한다. 인증 불필요. 결과의 kakaoPlaceId를 "
                    + "POST /api/v1/restaurants 요청에 그대로 넣어 등록한다. "
                    + "size는 15건 고정이며 카카오 정책상 page*size<=45라 page는 1~3만 유효하다.")
    public KakaoPlaceSearchResponse search(
            @RequestParam @NotBlank String query,
            @RequestParam(defaultValue = "1") @Min(1) @Max(3) int page) {
        KakaoSearchResult result = kakaoLocalClient.searchByKeyword(query.trim(), page);
        return KakaoPlaceSearchResponse.of(result, page);
    }
}
