package com.katsurank.restaurant;

import jakarta.validation.constraints.NotBlank;

public record RelocateRequest(@NotBlank String newKakaoPlaceId) {
}
