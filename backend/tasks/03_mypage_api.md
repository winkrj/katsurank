# 마이페이지 API 구현 스펙

> 공통 컨벤션은 `00_common.md` 참조 (rank 정책, 에러 패턴, 스키마 변경 원칙)

## 목표
로그인한 사용자의 현재 1순위 가게와 표 이동 히스토리를 반환하는 API를 구현한다.

## 전제 (이미 존재하는 것)
- `User` 엔티티 (`id`, `kakaoId`, `nickname`, `profileImage`, `currentVoteId`)
- `Vote` 엔티티 (`id`, `userId`, `restaurantId`, `votedAt`, `isCurrent`)
- `VoteRepository` 존재
- `AuthController` 에 `GET /api/v1/auth/me` 존재 — **세션 유효성 확인 전용** (프론트 초기 로딩 시 로그인 여부 판단용, 가벼운 응답). 이번 태스크의 `/api/v1/me` 와 역할이 다름
- `@LoginUser` ArgumentResolver 존재 (컨트롤러 파라미터에 `AuthPrincipal` 주입)
- **로그아웃은 SecurityConfig 에 이미 구현됨** — 이번 태스크에서 변경 없음

## 스키마 변경: 없음

---

## API 스펙

### GET `/api/v1/me`
내 정보 + 현재 1순위 가게. 인증 필요 (미인증 401).

`/api/v1/auth/me` 와의 차이: `/auth/me` 는 세션 유효성만 확인 (가벼운 응답), `/me` 는 마이페이지 전체 정보 (currentVote + rank 포함).

**Response 200**
```json
{
  "id": 1,
  "nickname": "홍길동",
  "profileImage": "https://k.kakaocdn.net/...",
  "currentVote": {
    "restaurantId": 42,
    "restaurantName": "명동돈가스",
    "restaurantStatus": "ACTIVE",
    "votedAt": "2026-06-01T12:00:00Z",
    "rank": 1
  }
}
```

- `currentVote` 는 아직 투표한 적 없으면 `null`
- `restaurantStatus` 가 CLOSED 이면 프론트에서 "폐업한 ○○" 표시용
- `rank` 는 집계 기반 (`00_common.md` 참조). ACTIVE 아닌 가게면 `null`

---

### GET `/api/v1/me/vote-history`
표 이동 히스토리 (전체, 최신순). 인증 필요.

**Response 200**
```json
[
  {
    "restaurantId": 42,
    "restaurantName": "명동돈가스",
    "restaurantStatus": "ACTIVE",
    "votedAt": "2026-06-01T12:00:00Z",
    "isCurrent": true
  },
  {
    "restaurantId": 15,
    "restaurantName": "을지돈가스",
    "restaurantStatus": "ACTIVE",
    "votedAt": "2026-05-10T09:30:00Z",
    "isCurrent": false
  }
]
```

**비즈니스 규칙**
- `user_id = 현재 사용자` 조건
- `voted_at DESC` 정렬 (최신이 첫 번째)
- CLOSED/RELOCATED 가게도 포함 (히스토리이므로 status 무관)
- 페이지네이션 없음 (투표 이동 횟수는 많아도 수십 회 수준)

---

### 로그아웃 — 이미 구현됨, 변경 없음

`POST /api/v1/auth/logout` 은 SecurityConfig 에 이미 설정되어 있다:
- 응답: **204 No Content** (`HttpStatusReturningLogoutSuccessHandler`)
- 세션 invalidate + `SESSION` 쿠키 삭제
- 비로그인 상태에서 호출해도 에러 없음 (permitAll)

**이번 태스크에서 SecurityConfig 을 수정하지 말 것.** 테스트만 작성한다.

---

## 구현 가이드

### 파일 위치
- `com.katsurank.me.MeController` — `/api/v1/me`, `/api/v1/me/vote-history`
- `com.katsurank.me.MeService` — 조회 로직
- `com.katsurank.me.MeResponse` — record
- `com.katsurank.me.VoteHistoryItem` — record

### MeService 구현 포인트
```java
// currentVote 조회: User.currentVoteId → Vote → Restaurant (N+1 주의, fetch join 사용)
// vote-history: VoteRepository.findByUserIdOrderByVotedAtDesc(userId)
//   → Restaurant 정보 포함 필요 (fetch join 또는 별도 쿼리)
```

### rank 계산
`GET /api/v1/me` 의 `currentVote.rank` 는 02 태스크의 집계 기반 rank 계산과 동일:
```java
long rank = restaurantRepository.countByStatusAndVoteCountGreaterThan(ACTIVE, voteCount) + 1;
// ACTIVE 아닌 가게면 rank = null
```

### 금지 사항
- `GET /api/v1/auth/me` 를 수정하거나 `/api/v1/me` 와 통합하지 말 것 — 역할이 다름
- SecurityConfig 로그아웃 설정 수정 금지 — 이미 동작함
- Flyway 마이그레이션 파일 생성 금지

## 완료 조건
- [ ] `GET /api/v1/me` — 투표 없으면 `currentVote: null`
- [ ] `GET /api/v1/me` — CLOSED 가게 투표 중이면 `restaurantStatus: "CLOSED"`, `rank: null`
- [ ] `GET /api/v1/me/vote-history` — voted_at 내림차순, CLOSED 가게 포함
- [ ] `POST /api/v1/auth/logout` — 세션 무효화, 이후 `/api/v1/auth/me` 호출 시 401 (테스트만)
- [ ] `./gradlew test` 통과

## 테스트 케이스
- 투표 이력 없는 신규 유저 → `currentVote: null`, history `[]`
- 투표 후 표 이동 → history 2개 (최신순), `isCurrent` 각각 true/false
- 로그아웃 후 인증 필요 API 호출 → 401
- 비로그인 상태에서 logout → **204** (에러 없음)
