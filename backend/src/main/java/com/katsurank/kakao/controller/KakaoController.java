package com.katsurank.kakao.controller;

import com.katsurank.kakao.dto.KakaoSearchResult;

import com.katsurank.kakao.dto.KakaoPlace;

import com.katsurank.kakao.client.KakaoLocalClient;

import com.katsurank.common.web.ApiResponse;
import com.katsurank.common.web.PageResponse;
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
            description = "카카오 로컬 API를 프록시하되, 서울 지역이 아니거나 돈까스 관련 카테고리·이름이 아닌 결과는 "
                    + "서버에서 걸러낸다(느슨한 사전 필터 — 최종 판단은 등록 시점 화이트리스트가 한다). 인증 불필요. 결과의 kakaoPlaceId를 "
                    + "POST /api/v1/restaurants 요청에 그대로 넣어 등록한다. "
                    + "카카오 원본 페이지(최대 3페이지, 45건)를 서버에서 모두 모아 필터링한 뒤, 그 결과를 요청받은 offset/limit로 "
                    + "슬라이싱해 돌려준다 — 필터링 후 실제 결과가 45건을 넘을 수 없으므로 offset+limit도 그 범위 안에서만 의미가 있다. "
                    + "total도 필터링 후 실제 결과 개수 기준이다.")
    public ApiResponse<PageResponse<KakaoPlace>> search(
            @RequestParam @NotBlank String query,
            @RequestParam(defaultValue = "0") @Min(0) int offset,
            @RequestParam(defaultValue = "15") @Min(1) @Max(45) int limit) {
        KakaoSearchResult result = kakaoLocalClient.searchByKeyword(query.trim(), offset, limit);
        return ApiResponse.success(new PageResponse<>(result.places(), result.totalCount(), offset, limit));
    }
}
