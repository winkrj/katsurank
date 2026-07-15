/**
 * 가게(Restaurant) — 등록·조회·상태 관리(ACTIVE/CLOSED/RELOCATED/PENDING/REJECTED).
 * hard delete 금지, 폐업=박제·이전=승계. 체인점은 지점마다 독립 레코드.
 *
 * <p>등록은 {@code kakao_place_id} 중복 차단 + 카테고리 화이트리스트({@link com.katsurank.restaurant.CategoryValidator})
 * + 서울 지역 검증({@link com.katsurank.restaurant.SeoulAddressValidator})으로 거부 시 예외
 * ({@link com.katsurank.restaurant.CategoryNotAllowedException}, {@link com.katsurank.restaurant.RegionNotAllowedException})를
 * 던진다(영속하지 않음).
 * 투표·랭킹·폐업/이전 로직은 후속 작업.
 */
package com.katsurank.restaurant;
