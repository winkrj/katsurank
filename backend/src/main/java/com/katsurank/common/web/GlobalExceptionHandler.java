package com.katsurank.common.web;

import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 도메인 예외와 검증 실패를 일관된 {@link ApiError} JSON 으로 변환한다.
 *
 * <p>공통 응답 래퍼(ApiResponse) 도입은 미결정(03 문서 8장)이므로, 정상 응답은 순수 DTO 로 두고
 * 에러 본문에만 최소 포맷을 적용한다.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiError> handleApiException(ApiException ex) {
        if (ex.status().is5xxServerError()) {
            log.error("도메인 예외(5xx) code={} : {}", ex.code(), ex.getMessage(), ex);
        } else {
            log.warn("도메인 예외 code={} status={} : {}", ex.code(), ex.status().value(), ex.getMessage());
        }
        return ResponseEntity.status(ex.status()).body(new ApiError(ex.code(), ex.getMessage()));
    }

    /** @RequestBody @Valid 실패 (Bean Validation) → 400. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        FieldError fieldError = ex.getBindingResult().getFieldError();
        String message = fieldError != null
                ? "%s: %s".formatted(fieldError.getField(), fieldError.getDefaultMessage())
                : "요청 값이 올바르지 않습니다.";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError("VALIDATION_ERROR", message));
    }

    /** @RequestParam/@PathVariable 제약 위반 → 400. */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(ConstraintViolationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError("VALIDATION_ERROR", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError("INVALID_ARGUMENT", ex.getMessage()));
    }
}
