package com.katsurank.common.web;

public record ApiResponse<T>(boolean success, T data, ApiError error) {

    public ApiResponse {
        if (success == (error != null)) {
            throw new IllegalArgumentException("성공 응답에는 error가 없어야 하고 실패 응답에는 error가 있어야 합니다.");
        }
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static ApiResponse<Void> error(String code, String message) {
        return new ApiResponse<>(false, null, new ApiError(code, message));
    }
}
