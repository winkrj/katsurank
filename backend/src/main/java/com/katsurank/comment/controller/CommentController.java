package com.katsurank.comment.controller;

import com.katsurank.auth.AuthPrincipal;
import com.katsurank.auth.controller.LoginUser;
import com.katsurank.comment.dto.CommentRequest;
import com.katsurank.comment.dto.CommentResponse;
import com.katsurank.comment.service.CommentService;
import com.katsurank.common.web.ApiResponse;
import com.katsurank.common.web.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/restaurants/{restaurantId}/comments")
@Tag(name = "댓글", description = "가게별 1인 1댓글")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping
    @Operation(summary = "가게 댓글 목록", description = "인증 없이 최신 작성순으로 조회한다.")
    public ApiResponse<PageResponse<CommentResponse>> getComments(
            @PathVariable Long restaurantId,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "20") int limit) {
        return ApiResponse.success(commentService.getComments(restaurantId, offset, limit));
    }

    @PostMapping
    @Operation(summary = "댓글 작성", description = "로그인 사용자는 ACTIVE 가게마다 댓글 하나를 작성할 수 있다.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "작성 성공")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "로그인 필요")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409",
            description = "중복 댓글(COMMENT_ALREADY_EXISTS) 또는 작성 불가 가게(RESTAURANT_NOT_COMMENTABLE)",
            content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    public ResponseEntity<ApiResponse<CommentResponse>> create(
            @PathVariable Long restaurantId,
            @Valid @RequestBody CommentRequest request,
            @LoginUser AuthPrincipal principal) {
        CommentResponse response = commentService.create(restaurantId, principal.userId(), request.content());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PatchMapping("/{commentId}")
    @Operation(summary = "댓글 수정", description = "작성자 본인이 ACTIVE 가게의 댓글 내용을 수정한다.")
    public ApiResponse<CommentResponse> update(
            @PathVariable Long restaurantId,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequest request,
            @LoginUser AuthPrincipal principal) {
        return ApiResponse.success(
                commentService.update(restaurantId, commentId, principal.userId(), request.content()));
    }

    @DeleteMapping("/{commentId}")
    @Operation(summary = "댓글 삭제", description = "작성자 본인이 댓글을 영구 삭제한다. 가게 상태와 무관하게 가능하다.")
    public ResponseEntity<Void> delete(
            @PathVariable Long restaurantId,
            @PathVariable Long commentId,
            @LoginUser AuthPrincipal principal) {
        commentService.delete(restaurantId, commentId, principal.userId());
        return ResponseEntity.noContent().build();
    }
}
