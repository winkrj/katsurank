## Why

가게 상세에서 사용자 경험을 공유할 수단이 없고, 현재 순위만 제공되어 최근 순위 변화를 확인할 수 없다. 가게별 1인 1댓글과 안정적인 일별 순위 기록을 최소 범위로 추가해 상세 화면의 정보성과 랭킹의 맥락을 강화한다.

## What Changes

- 로그인 사용자가 ACTIVE 가게마다 댓글 하나를 작성하고 자신의 댓글을 수정·삭제할 수 있는 REST API를 추가한다.
- 모든 사용자가 가게별 댓글을 최신 작성순으로 페이지 조회할 수 있게 한다.
- 댓글의 사용자·가게별 유일성과 입력 길이, 소유권, 가게 상태 정책을 애플리케이션과 DB 제약으로 보장한다.
- 매일 KST 자정에 ACTIVE 가게 전체의 서울 단일 랭킹 순위와 득표 수를 일별 스냅샷으로 저장한다.
- 가게별 최근 7개 일별 순위 스냅샷을 날짜 오름차순으로 조회하는 공개 REST API를 추가한다.
- 댓글 좋아요·대댓글·신고·수정 이력과 순위 실시간 히스토리·누락 데이터 보간은 범위에서 제외한다.

## Capabilities

### New Capabilities

- `restaurant-comments`: 가게별 1인 1댓글의 작성, 조회, 수정, 삭제와 접근·검증 정책
- `restaurant-ranking-history`: KST 기준 일별 랭킹 스냅샷 생성과 가게별 최근 7개 이력 조회

### Modified Capabilities

없음.

## Impact

- PostgreSQL/Flyway에 댓글 및 일별 랭킹 스냅샷 테이블과 인덱스가 추가된다.
- `/api/v1/restaurants/{restaurantId}/comments` 하위 API와 `/api/v1/restaurants/{restaurantId}/ranking-history` API가 추가된다.
- 백엔드에 comment 기능 계층과 ranking 히스토리 조회·스케줄링 구성요소가 추가된다.
- 기존 Spring Security 세션 인증, CSRF, 공통 응답 및 페이지네이션 규칙을 그대로 사용하며 새 의존성은 추가하지 않는다.
- 기존 API에 breaking change는 없다.
