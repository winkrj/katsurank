# 데이터 모델 & 기술 결정

- **버전**: v0.1
- **작성일**: 2026-05-11

---

## 1. 기술 스택 (확정)

| 영역 | 선택 | 이유 |
|---|---|---|
| 백엔드 | Spring Boot 3.x + Java | 본인 현업 경력 |
| ORM | JPA (Hibernate) | Spring Boot 표준 |
| DB | PostgreSQL | 무료 호스팅 무난, JSON 지원 |
| 프론트 | Thymeleaf + HTMX | 1인 개발, 한 달 일정 |
| 지도 | 카카오맵 JS SDK | 한국 데이터 최강, 무료 한도 충분 |
| 가게 검색 API | 카카오 로컬 API | 일 30만 건 무료 |
| 인증 | 카카오 OAuth2 (Spring Security) | 가입 마찰 최소 |
| 호스팅 (검토) | Railway / Fly.io / 오라클 Always Free | 무료 티어 |
| 도메인 | 가비아 또는 Cloudflare | 1.5만원/년 정도 |

> ⚠️ **호스팅은 다음 단계에서 최종 결정.** Railway는 편하지만 무료 티어가 약함. 오라클 Always Free는 진짜 무료지만 셋업이 까다로움.

---

## 2. 데이터 모델

### User
```
id              BIGINT PK
kakao_id        BIGINT UNIQUE NOT NULL
nickname        VARCHAR(50)
profile_image   VARCHAR(500)
created_at      TIMESTAMP
last_login_at   TIMESTAMP
current_vote_id BIGINT FK -> Vote (nullable)  -- 현재 유효 1표 빠른 조회용
```

### Restaurant
```
id               BIGINT PK
kakao_place_id   VARCHAR(50) UNIQUE NOT NULL  -- 중복 방지 핵심
name             VARCHAR(200) NOT NULL
address          VARCHAR(500)
road_address     VARCHAR(500)
latitude         DECIMAL(10, 7)
longitude        DECIMAL(10, 7)
kakao_category   VARCHAR(200)                  -- 예: "음식점 > 일식 > 돈까스,우동"
phone            VARCHAR(30)
place_url        VARCHAR(500)                  -- 카카오맵 외부 링크
status           VARCHAR(20)                   -- ACTIVE | PENDING | REJECTED
category         VARCHAR(50) DEFAULT 'TONKATSU' -- V2 확장 대비
vote_count       INT DEFAULT 0                 -- 비정규화 캐시
created_by       BIGINT FK -> User (nullable)
created_at       TIMESTAMP
updated_at       TIMESTAMP

INDEX idx_status_vote_count (status, vote_count DESC)
INDEX idx_lat_lng (latitude, longitude)
INDEX idx_category (category)
```

### Vote
```
id            BIGINT PK
user_id       BIGINT FK -> User NOT NULL
restaurant_id BIGINT FK -> Restaurant NOT NULL
voted_at      TIMESTAMP
is_current    BOOLEAN DEFAULT TRUE
version       BIGINT                          -- @Version 낙관적 락

PARTIAL UNIQUE INDEX (user_id) WHERE is_current = TRUE
INDEX idx_user_voted_at (user_id, voted_at DESC)
INDEX idx_restaurant_current (restaurant_id, is_current)
```

> 💡 **표 이동 동작**:
> 1. 트랜잭션 시작
> 2. 기존 Vote의 `is_current = false` UPDATE
> 3. 기존 Restaurant `vote_count -= 1`
> 4. 새 Vote INSERT (`is_current = true`)
> 5. 새 Restaurant `vote_count += 1`
> 6. User `current_vote_id` 갱신
> 7. 커밋
>
> 동시성: `vote_count`에 `@Version` 낙관적 락 적용. 충돌 시 재시도.

---

## 3. 화면 구성 (MVP)

1. **메인** (`/`) — 지도 + 사이드/하단 랭킹
2. **가게 상세** (`/restaurants/{id}`) — 정보 + 투표
3. **가게 추가** (`/restaurants/new`) — 카카오맵 검색 → 등록
4. **마이페이지** (`/me`) — 현재 1순위 + 표 이동 히스토리
5. **로그인 콜백** (`/oauth/kakao/callback`)
6. **약관 / 개인정보처리방침** (`/terms`, `/privacy`)

---

## 4. API 엔드포인트 (초안)

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/restaurants` | 랭킹 조회 (지도 영역·정렬 파라미터) |
| GET | `/api/restaurants/{id}` | 가게 상세 |
| POST | `/api/restaurants` | 가게 추가 (카카오맵 place_id 기반) |
| GET | `/api/restaurants/search` | 자체 DB 이름 검색 |
| GET | `/api/kakao-places/search` | 카카오 로컬 API 프록시 (가게 추가용) |
| POST | `/api/votes` | 투표 / 표 이동 |
| GET | `/api/me` | 내 정보 + 현재 1순위 |
| GET | `/api/me/vote-history` | 표 이동 히스토리 |

---

## 5. 주요 기술적 결정

### 5.1 지도 랭킹 = 지도 뷰포트 기반

랭킹 API에 `bounds` 파라미터 (남서·북동 좌표) 받아서 그 안의 가게만 정렬.

```
GET /api/restaurants?sw_lat=37.5&sw_lng=126.9&ne_lat=37.6&ne_lng=127.1&limit=10
```

### 5.2 카테고리 화이트리스트

가게 등록 시 카카오 카테고리 검사:
- "돈까스", "돈가스", "경양식" 중 하나라도 포함하면 ACTIVE
- 아니면 REJECTED + 사용자에게 사유 안내

### 5.3 실시간 = 30초 폴링

- 메인 화면 JS가 `setInterval(30000)`로 `/api/restaurants` 재호출
- 페이지 가시성 API로 백그라운드 탭은 폴링 중지 (서버 부담↓)

### 5.4 카카오 로컬 API 호출 최소화

- 가게 등록 시에만 카카오 API 호출
- 등록 후엔 자체 DB에서 조회 (카카오 API 매번 호출 X)
- 카카오 API 응답 캐시 (Redis 안 쓰고 인메모리 Caffeine으로 충분)

---

## 6. 미결정 사항

- [ ] 호스팅 최종 선택 (Railway vs 오라클 vs 기타)
- [ ] 도메인 이름 (네이밍 확정 후)
- [ ] CI/CD 방법 (GitHub Actions vs 호스팅 자체 빌드)
- [ ] 에러 모니터링 (Sentry 무료 티어 vs 자체 로그)

---

## 변경 이력

- **v0.1 (2026-05-11)**: 초안 작성.
