package com.katsurank.restaurant.dto;

import jakarta.validation.constraints.NotBlank;

public record RelocateRequest(@NotBlank String newKakaoPlaceId) {
}
