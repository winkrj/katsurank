package com.katsurank.common.web;

import com.katsurank.common.domain.DomainException;
import com.katsurank.ranking.exception.SseCapacityExceededException;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.bind.ServletRequestBindingException;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;

/**
 * 도메인 예외와 검증 실패를 일관된 {@link ApiResponse} JSON 으로 변환한다.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** EventSource 요청에서도 메시지 변환 없이 확실히 503을 반환한다. */
    @ExceptionHandler(SseCapacityExceededException.class)
    public ResponseEntity<Void> handleSseCapacityExceeded(SseCapacityExceededException ex) {
        log.atWarn().addKeyValue("errorCode", ex.code()).log("SSE 연결 상한 초과");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
    }

    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ApiResponse<Void>> handleDomainException(DomainException ex) {
        HttpStatus status = statusFor(ex.code());
        if (status.is5xxServerError()) {
            log.atError().setCause(ex).addKeyValue("errorCode", ex.code())
                    .log("도메인 예외(5xx)");
        } else {
            log.atWarn().addKeyValue("errorCode", ex.code()).addKeyValue("status", status.value())
                    .log("도메인 예외: {}", ex.getMessage());
        }
        return ResponseEntity.status(status).body(ApiResponse.error(ex.code(), ex.getMessage()));
    }

    /** @RequestBody @Valid 실패 (Bean Validation) → 400. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        FieldError fieldError = ex.getBindingResult().getFieldError();
        String message = fieldError != null
                ? "%s: %s".formatted(fieldError.getField(), fieldError.getDefaultMessage())
                : "요청 값이 올바르지 않습니다.";
        return badRequest("VALIDATION_ERROR", message);
    }

    /** @RequestParam/@PathVariable 제약 위반 → 400. */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(ConstraintViolationException ex) {
        return badRequest("VALIDATION_ERROR", ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException ex) {
        return badRequest("INVALID_ARGUMENT", ex.getMessage());
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodValidation(HandlerMethodValidationException ex) {
        return badRequest("VALIDATION_ERROR", "요청 값이 올바르지 않습니다.");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnreadableMessage(HttpMessageNotReadableException ex) {
        return badRequest("INVALID_REQUEST_BODY", "요청 본문을 읽을 수 없습니다.");
    }

    @ExceptionHandler(ServletRequestBindingException.class)
    public ResponseEntity<ApiResponse<Void>> handleRequestBinding(ServletRequestBindingException ex) {
        return badRequest("INVALID_REQUEST", "필수 요청 값이 없거나 올바르지 않습니다.");
    }

    /** SSE 등 비동기 응답에서 클라이언트가 연결을 닫은 경우에는 새 응답 본문을 쓰지 않는다. */
    @ExceptionHandler(AsyncRequestNotUsableException.class)
    public void handleDisconnectedAsyncClient(AsyncRequestNotUsableException ex) {
        log.atDebug().log("비동기 클라이언트 연결 종료");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception ex) {
        log.atError().setCause(ex).log("처리되지 않은 서버 예외");
        return ResponseEntity.internalServerError()
                .body(ApiResponse.error("INTERNAL_SERVER_ERROR", "서버 오류가 발생했습니다."));
    }

    private ResponseEntity<ApiResponse<Void>> badRequest(String code, String message) {
        return ResponseEntity.badRequest().body(ApiResponse.error(code, message));
    }

    private HttpStatus statusFor(String code) {
        return switch (code) {
            case "USER_NOT_FOUND", "RESTAURANT_NOT_FOUND", "NEW_PLACE_NOT_FOUND" -> HttpStatus.NOT_FOUND;
            case "LIMIT_EXCEEDED" -> HttpStatus.BAD_REQUEST;
            case "CATEGORY_NOT_ALLOWED", "REGION_NOT_ALLOWED" -> HttpStatus.UNPROCESSABLE_CONTENT;
            case "KAKAO_API_ERROR" -> HttpStatus.BAD_GATEWAY;
            case "SSE_CAPACITY_EXCEEDED" -> HttpStatus.SERVICE_UNAVAILABLE;
            case "DUPLICATE_PLACE", "ALREADY_CLOSED", "RESTAURANT_NOT_VOTABLE", "VOTE_CONFLICT" ->
                    HttpStatus.CONFLICT;
            default -> HttpStatus.INTERNAL_SERVER_ERROR;
        };
    }
}
