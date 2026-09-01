## Context

현재 가게 상세 API는 현재 득표 수와 서울 단일 랭킹 순위를 제공하지만 사용자 경험을 남기거나 과거 순위 변화를 조회할 수 없다. 투표 이력은 비활성화 시각을 직접 보존하지 않고 가게 이전이 현재 표를 새 레코드로 발행하므로, 기존 데이터만으로 특정 과거 시점의 순위를 정확히 복원할 수 없다.

구현은 기존 Spring Boot 3계층, JPA/QueryDSL, PostgreSQL/Flyway, 세션 인증과 공통 `ApiResponse`/`PageResponse` 패턴을 따라야 한다. 모든 저장 시각은 UTC이며 서울 랭킹의 일자 경계만 KST를 사용한다.

## Goals / Non-Goals

**Goals:**

- 가게별 사용자 1인 1댓글 CRUD를 DB 제약까지 포함해 보장한다.
- 공개 댓글 목록과 인증된 작성·수정·삭제 API를 기존 REST 규칙에 맞춰 제공한다.
- 현재와 동일한 동점 정책으로 ACTIVE 가게 전체의 일별 순위를 안정적으로 기록한다.
- 가게별 최근 7개 실제 스냅샷을 단순하고 예측 가능한 응답으로 제공한다.
- 새 dependency나 별도 인프라 없이 현재 애플리케이션과 PostgreSQL만 사용한다.

**Non-Goals:**

- 댓글 좋아요, 대댓글, 신고, 관리자 모더레이션, 삭제·수정 이력
- 댓글 수 비정규화 및 댓글 목록 캐시
- 일중 순위 변화, 과거 순위 역산, 누락 스냅샷 보간·자동 복구
- 이전된 가게 사이의 댓글 또는 순위 히스토리 병합
- 기존 랭킹 SSE 이벤트에 댓글이나 일별 스냅샷 이벤트 추가

## Decisions

### 1. 댓글은 독립 `comment` 기능과 단순 CRUD 모델로 구현한다

`comments` 테이블은 `id`, `restaurant_id`, `user_id`, `content`, `created_at`, `updated_at`만 가진다. `(restaurant_id, user_id)` UNIQUE 제약으로 가게별 1인 1댓글을 최종 보장하고 `(restaurant_id, created_at DESC, id DESC)` 인덱스로 목록 조회를 지원한다. JPA 엔티티는 기존 Vote 패턴처럼 연관 엔티티 대신 FK ID를 보유하며, 내용 변경은 엔티티 메서드로만 수행한다.

댓글은 사용자에게 삭제 의사가 명확하고 Restaurant/Vote의 영구 보존 정책 대상이 아니므로 hard delete한다. soft delete와 재활성화는 삭제 상태, UNIQUE 충돌, 재작성 정책을 추가하므로 현 범위에서는 사용하지 않는다. 동시 중복 작성은 사전 존재 검사뿐 아니라 DB UNIQUE 위반을 `COMMENT_ALREADY_EXISTS`로 변환한다.

### 2. 댓글 API는 중첩 리소스와 기존 페이지 규칙을 사용한다

목록·작성은 `/api/v1/restaurants/{restaurantId}/comments`, 수정·삭제는 `/api/v1/restaurants/{restaurantId}/comments/{commentId}`를 사용한다. 목록은 `offset` 기본 0, `limit` 기본 20, 최대 100인 `PageResponse<CommentResponse>`이며 `created_at DESC, id DESC`로 정렬한다.

응답 작성자는 기존 인증 API와 같은 사용자 ID, 현재 닉네임, 현재 프로필 이미지를 포함한다. 별도 `mine` 필드는 추가하지 않고 클라이언트가 `/api/v1/auth/me`의 ID와 비교한다. 댓글 내용은 요청 record에서 `@NotBlank`, `@Size(max=500)`로 검증한 뒤 양끝 공백을 제거해 저장한다.

GET은 공개하고 POST/PATCH/DELETE는 기존 Security 기본 규칙으로 인증을 요구한다. ACTIVE 가게에서만 작성·수정할 수 있고 CLOSED/RELOCATED 가게의 기존 댓글은 조회·삭제할 수 있다. 수정·삭제 시 URL의 가게 ID와 댓글의 가게 ID가 일치해야 하며 작성자 본인만 변경할 수 있다.

### 3. 순위 이력은 일별 전체 스냅샷으로 저장한다

`ranking_daily_snapshots`는 `(snapshot_date, restaurant_id)`를 복합 PK로 하고 `rank`, `vote_count`, `captured_at`을 저장한다. `snapshot_date`는 KST 날짜이고 `captured_at`은 UTC `Instant`다. `(restaurant_id, snapshot_date DESC)` 인덱스로 가게별 최근 이력을 조회한다. 별도 `ranking_daily_snapshot_runs`는 `snapshot_date` PK와 `captured_at`만 저장해 ACTIVE 가게가 0개인 날에도 실행 완료를 남긴다.

스케줄러는 `@Scheduled(cron = "0 0 0 * * *", zone = "Asia/Seoul")`로 매일 자정 실행한다. 단일 트랜잭션의 PostgreSQL native CTE가 먼저 날짜 실행 마커를 `INSERT ... ON CONFLICT DO NOTHING RETURNING`으로 선점하고, 선점한 실행만 ACTIVE 가게 전체를 읽어 스냅샷을 기록한다. `RANK() OVER (ORDER BY vote_count DESC)`를 사용해 현재 경쟁 순위 `1, 2, 2, 4`를 보존한다. 날짜 마커 PK로 빈 최초 실행, 순차 재실행, 다중 인스턴스 동시 실행을 모두 멱등하게 만든다.

현재 TOP 20 인메모리 캐시는 전체 가게를 포함하지 않으므로 스냅샷 원본으로 사용하지 않는다. 투표 이벤트마다 순위를 기록하는 방식은 한 표가 여러 가게 순위에 영향을 주고 쓰기량을 늘리므로 채택하지 않는다. 기존 Vote를 역산하는 방식은 비활성화 시각과 과거 상태 정보가 부족해 정확하지 않으므로 채택하지 않는다.

### 4. 히스토리 API는 저장된 최근 7건만 반환한다

`GET /api/v1/restaurants/{restaurantId}/ranking-history`는 인증 없이 호출할 수 있고, 해당 가게의 최근 7개 실제 스냅샷을 조회한 뒤 날짜 오름차순으로 반환한다. 고정된 작은 결과이므로 페이지네이션과 조회 기간 파라미터를 추가하지 않는다.

현재 실시간 순위는 기존 가게 상세 응답의 `rank`가 담당한다. 일별 이력에 가변적인 오늘 실시간 값을 섞거나 누락 날짜를 합성하지 않는다. 존재하는 가게에 이력이 없으면 빈 배열, 존재하지 않는 가게면 기존 `RESTAURANT_NOT_FOUND`를 반환한다. 폐업·이전 이후 새 스냅샷은 생기지 않지만 기존 기록은 그대로 조회한다.

## Risks / Trade-offs

- [애플리케이션이 자정에 중지되면 해당 날짜 스냅샷이 누락됨] → API는 실제 데이터만 반환하고 누락값을 만들지 않는다. 운영 필요가 확인되기 전에는 복구 스케줄러를 추가하지 않는다.
- [스냅샷 실행 순간과 동시에 투표가 발생할 수 있음] → 단일 DB 트랜잭션의 한 시점 조회로 내부 일관성을 확보하며, 자정 부근의 커밋 경계는 DB가 관측한 스냅샷 시점으로 정의한다.
- [댓글 hard delete로 운영 감사 자료가 남지 않음] → 현재는 신고·모더레이션 범위가 없으므로 단순성을 우선하고, 해당 기능 도입 시 별도 정책과 마이그레이션을 설계한다.
- [모든 ACTIVE 가게를 매일 저장해 데이터가 계속 증가함] → 일별 가게당 한 행으로 초기 서비스 규모에서는 작고, 보존 데이터는 나중에 복구할 수 없으므로 삭제 정책을 두지 않는다.

## Migration Plan

1. Flyway 마이그레이션으로 두 테이블, FK, UNIQUE, 인덱스를 추가한다.
2. 댓글 API와 일별 스냅샷 생성·조회 코드를 배포한다. 기존 데이터의 backfill은 수행하지 않는다.
3. 배포 후 댓글 CRUD와 수동 스냅샷 서비스 호출 테스트로 DB 제약 및 조회를 확인한다.
4. 롤백 시 이전 애플리케이션은 신규 테이블을 참조하지 않으므로 코드만 이전 버전으로 되돌릴 수 있다. 운영 데이터가 생긴 테이블은 자동 삭제하지 않고 후속 Flyway 변경으로만 정리한다.

## Open Questions

없음.
