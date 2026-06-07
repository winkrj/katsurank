-- =========================================================
-- V3: restaurants 낙관적 락용 version 컬럼
-- 표 이동 시 경합되는 핫 필드는 restaurants.vote_count 이므로,
-- @Version 낙관적 락은 Restaurant 에 둔다(03 문서 2장 Vote 주석: "락은 Restaurant.vote_count 에 적용").
-- 기존 행은 DEFAULT 0 으로 채운다.
-- =========================================================
ALTER TABLE restaurants ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
