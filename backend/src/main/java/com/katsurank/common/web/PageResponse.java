package com.katsurank.common.web;

import java.util.List;

/** 목록 조회 API 공통 응답 포맷. offset 기반 페이지네이션. */
public record PageResponse<T>(
        List<T> items,
        long total,
        int offset,
        int limit) {
}
