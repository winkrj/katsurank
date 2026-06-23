package com.katsurank.restaurant;

/**
 * 가게 상태. hard delete 금지 — 폐업/이전도 상태로만 관리한다.
 *
 * <ul>
 *   <li>{@link #ACTIVE} — 정상 노출·투표·랭킹 대상.</li>
 *   <li>{@link #CLOSED} — 폐업(박제). 표·히스토리 보존, 랭킹 제외.</li>
 *   <li>{@link #RELOCATED} — 이전(승계). {@code relocated_to_id} 로 새 레코드 연결.</li>
 *   <li>{@link #PENDING} — 등록 후 심사 대기(운영자 수동 검토 흐름용, MVP 예약).</li>
 *   <li>{@link #REJECTED} — 카테고리 미달 등으로 거부.</li>
 * </ul>
 */
public enum RestaurantStatus {
    ACTIVE,
    CLOSED,
    RELOCATED,
    PENDING,
    REJECTED
}
