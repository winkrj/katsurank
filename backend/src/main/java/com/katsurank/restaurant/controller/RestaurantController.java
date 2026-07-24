package com.katsurank.restaurant.controller;

import com.katsurank.restaurant.dto.RelocateResponse;

import com.katsurank.restaurant.dto.RelocateRequest;

import com.katsurank.restaurant.dto.RestaurantRegisterRequest;

import com.katsurank.restaurant.dto.RestaurantSearchResponse;

import com.katsurank.restaurant.dto.CloseResponse;

import com.katsurank.restaurant.dto.RestaurantResponse;

import com.katsurank.restaurant.service.RestaurantService;

import com.katsurank.auth.AuthPrincipal;
import com.katsurank.auth.controller.LoginUser;
import com.katsurank.common.web.ApiResponse;
import com.katsurank.common.web.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 가게 API. 등록은 로그인 필요, 조회/검색은 공개(GET permitAll).
 */
@RestController
@RequestMapping("/api/v1/restaurants")
@Tag(name = "가게", description = "가게 등록·조회·검색·폐업/이전")
public class RestaurantController {

    private final RestaurantService restaurantService;

    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @PostMapping
    @Operation(summary = "가게 등록",
            description = "카카오 로컬 검색(GET /api/v1/kakao-places/search) 결과를 그대로 body로 보내 등록한다. "
                    + "돈까스/돈가스/경양식 카테고리 + 서울 지역만 허용되며, 등록자는 body가 아니라 로그인 세션에서 식별한다.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "등록 성공")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "로그인 필요")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "이미 등록된 kakaoPlaceId (DUPLICATE_PLACE)",
            content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "422", description = "허용되지 않는 카테고리 (CATEGORY_NOT_ALLOWED) 또는 서울 밖 주소 (REGION_NOT_ALLOWED)",
            content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    public ResponseEntity<ApiResponse<RestaurantResponse>> register(
            @Valid @RequestBody RestaurantRegisterRequest request,
            @LoginUser AuthPrincipal principal) {
        RestaurantResponse response = restaurantService.register(
                request.kakaoPlaceId(), request.name(), request.address(), request.roadAddress(),
                request.latitude(), request.longitude(), request.kakaoCategory(), request.phone(),
                request.placeUrl(), principal.userId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "가게 상세 조회", description = "인증 불필요. status와 무관하게 조회 가능(폐업/이전된 가게도 조회됨).")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "존재하지 않는 가게 (RESTAURANT_NOT_FOUND)",
            content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    public ApiResponse<RestaurantResponse> get(@PathVariable Long id) {
        return ApiResponse.success(restaurantService.getById(id));
    }

    @GetMapping("/search")
    @Operation(summary = "가게 이름 검색",
            description = "자체 DB에서 이름으로 검색. status=ACTIVE인 가게만 반환한다. "
                    + "q가 없으면 전체 목록을 vote_count 순으로 페이징 반환한다.")
    public ApiResponse<PageResponse<RestaurantSearchResponse>> search(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "20") int limit) {
        return ApiResponse.success(restaurantService.search(q, offset, limit));
    }

    @PatchMapping("/{id}/close")
    @Operation(summary = "가게 폐업 처리",
            description = "가게를 폐업(박제) 상태로 전환한다. 표·히스토리는 보존되고 랭킹에서만 제외된다. hard delete는 하지 않는다.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "로그인 필요")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "존재하지 않는 가게 (RESTAURANT_NOT_FOUND)",
            content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "이미 폐업/이전 처리됨 (ALREADY_CLOSED)",
            content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    public ApiResponse<CloseResponse> close(@PathVariable Long id) {
        return ApiResponse.success(restaurantService.close(id));
    }

    @PatchMapping("/{id}/relocate")
    @Operation(summary = "가게 이전 처리",
            description = "기존 가게의 표를 newKakaoPlaceId로 이미 등록돼 있는 새 레코드로 옮긴다(승계). "
                    + "새 레코드는 미리 POST /api/v1/restaurants로 등록돼 있어야 한다.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "로그인 필요")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "이전 대상 가게가 등록돼 있지 않음 (NEW_PLACE_NOT_FOUND)",
            content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "이미 폐업/이전 처리됨 (ALREADY_CLOSED)",
            content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    public ApiResponse<RelocateResponse> relocate(@PathVariable Long id,
                                                  @Valid @RequestBody RelocateRequest request) {
        return ApiResponse.success(restaurantService.relocate(id, request.newKakaoPlaceId()));
    }
}
