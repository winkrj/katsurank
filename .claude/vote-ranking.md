---
paths:
  - "src/main/java/com/katsurank/vote/**"
  - "src/main/java/com/katsurank/ranking/**"
  - "src/main/java/com/katsurank/restaurant/**"
---

# 투표 · 랭킹 · 가게 규칙

상세 모델은 `docs/03_data_model_and_tech.md`의 2 / 3 / 6 섹션 참조.

## 1인 1표 · 표 이동 (핵심 정합성 — 가장 신중하게)

- 1인 1표는 DB가 최종 보장: `Vote` 테이블에 `PARTIAL UNIQUE INDEX (user_id) WHERE is_current = TRUE`.
- 표 이동은 단일 트랜잭션(VoteService): 기존 Vote is_current=false → 기존 Restaurant vote_count-1 → 새 Vote insert(is_current=true) → 새 Restaurant vote_count+1 → User.current_vote_id 갱신.
- `vote_count`에 `@Version` 낙관적 락. 충돌 시 재시도(@Retryable 또는 수동 루프).
- 이 로직은 반드시 동시성 테스트를 동반할 것 (1인 1표가 깨지면 서비스 신뢰가 무너짐).

## 랭킹

- **서울 단일 랭킹 하나뿐.** `vote_count DESC` + `WHERE status = 'ACTIVE'`. 인덱스 `idx_status_vote_count` 활용.
- 뷰포트(bounds) 기반 랭킹 만들지 말 것. 지도 핀 목록(`/restaurants`)과 랭킹(`/ranking`)은 엔드포인트 분리.
- 30초 폴링으로 갱신 (실시간 WebSocket은 V1.1+).

## 가게 식별 · 상태

- `kakao_place_id` UNIQUE가 중복/지점 구분. 체인점은 지점별 독립 Restaurant.
- 카테고리 검증: "돈까스"·"돈가스"·"경양식" 포함 시 ACTIVE, 아니면 REJECTED.
- hard delete 금지. 폐업=CLOSED(박제), 이전=RELOCATED(relocated_to_id로 승계).
- 투표·랭킹 쿼리는 status=ACTIVE 기본. Vote 히스토리 조회는 status 무관.

## 카카오 API

- 카카오 로컬 API는 가게 등록 시에만 호출. 등록 후엔 자체 DB 조회.
- 응답 캐시는 인메모리 Caffeine (Redis 불필요).
