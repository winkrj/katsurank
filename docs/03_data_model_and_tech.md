# 데이터 모델 & 기술 결정

- **버전**: v0.2
- **작성일**: 2026-06-04
- **상태**: 백엔드 아키텍처 방향 확정 (REST API 전환, 단일 서울 랭킹, 식별·상태 정책 확정)

> v0.1 대비 주요 변경: 프론트가 React(Next.js) + 순수 REST API로 전환됨에 따라 인증·화면·API 구조가 바뀌었고, "서울 단일 랭킹" 확정으로 뷰포트 기반 랭킹 설계가 폐기됨. Restaurant 상태 모델·폐업/이전 정책이 추가됨. 자세한 변경은 맨 아래 변경 이력 참조.

---

## 1. 기술 스택 (확정)

| 영역 | 선택 | 이유 |
|---|---|---|
| 백엔드 | Spring Boot 4.0.x / Java 21 (LTS) | 본인 현업 경력, 가상 스레드 활용 |
| ORM | JPA (Hibernate) | Spring Boot 표준 |
| DB | PostgreSQL | 무료 호스팅 무난, JSON 지원 |
| DB 마이그레이션 | Flyway | 협업·배포 환경 스키마 안정성 (ddl-auto 의존 제거) |
| 프론트 | React (Next.js, TypeScript, Tailwind) | 별도 프론트 개발자 협업, Vercel 배포 |
| HTTP 클라이언트 | RestClient (Spring 6.1+) | 동기 호출에 단순·최신, RestTemplate 대체 |
| 지도 | 카카오맵 JS SDK | 한국 데이터 최강, 무료 한도 충분 |
| 가게 검색 API | 카카오 로컬 API | 일 30만 건 무료 |
| 인증 | 카카오 OAuth2 + 외부저장소 세션 (Spring Security / Spring Session) | 가입 마찰 최소, 즉시 무효화 가능, 수평 확장 대응 |
| 백엔드 호스팅 | Railway | 무료 티어, 배포 편의 |
| 프론트 호스팅 | Vercel | Next.js 최적, 무료 티어 |
| 도메인 (예정) | katsurank.kr | 1.5만원/년 정도 |

### 1.1 인증 방식 — 외부저장소 세션 (확정, JWT 아님)

- 카카오 OAuth2 로그인 성공 후 **세션 쿠키**(HttpOnly, SameSite) 발급.
- 세션은 톰캣 인메모리가 아니라 **외부 저장소**(`spring-session-jdbc`로 PostgreSQL, 또는 추후 Redis)에 저장 → 서버를 수평 확장해도 세션 공유, 재배포에도 유지.
- JWT를 쓰지 않는 이유: 단일 백엔드 + 자체 SPA 구조에서 JWT의 "무상태" 이점은 거의 없고, 무효화 불가(로그아웃·어뷰징 즉시 차단 어려움)라는 단점만 떠안음. 1인 1표 어뷰징 방어에는 즉시 무효화 가능한 세션이 유리.
- 향후 네이티브 모바일 앱을 붙이게 되면 그때 JWT 도입 재검토.

### 1.2 OAuth 콜백 흐름 (SPA 대응)

```
[프론트] "카카오 로그인" 클릭
   → window.location = {백엔드}/oauth2/authorization/kakao
[카카오] 로그인 + 동의
   → {백엔드}/login/oauth2/code/kakao
[백엔드] CustomOAuth2UserService: User upsert
   → OAuth2SuccessHandler: 세션 쿠키 발급 + 프론트 도메인으로 302 리다이렉트
[프론트] 이후 모든 API 요청에 쿠키 자동 동봉 (credentials: 'include')
```

- 쿠키 도메인: `Domain=.katsurank.kr` (프론트·백엔드 서브도메인 공유). 로컬은 `localhost`.
- CORS: 프론트 오리진(`https://katsurank.kr`, 로컬 `http://localhost:3000`)만 허용, `allowCredentials(true)`.
- CSRF: 쿠키 기반이므로 **처음부터 켠다**. SPA 표준인 Double Submit Cookie 방식(`CookieCsrfTokenRepository.withHttpOnlyFalse()`). (※ 05 문서의 "CSRF 일단 끔"은 Thymeleaf 전제였으므로 폐기.)

---

## 2. 데이터 모델

> **공통 원칙**
> - 모든 시각은 **UTC로 저장**, 표시 시점에만 KST 변환.
> - **hard delete 금지** — Restaurant·Vote는 상태/플래그로만 관리해 히스토리를 보존 (관측·복원 목적).

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
kakao_place_id   VARCHAR(50) UNIQUE NOT NULL  -- 중복 방지 핵심 (지점별 고유)
name             VARCHAR(200) NOT NULL
address          VARCHAR(500)
road_address     VARCHAR(500)
latitude         DECIMAL(10, 7)
longitude        DECIMAL(10, 7)
kakao_category   VARCHAR(200)                  -- 예: "음식점 > 일식 > 돈까스,우동"
phone            VARCHAR(30)
place_url        VARCHAR(500)                  -- 카카오맵 외부 링크
status           VARCHAR(20)                   -- ACTIVE | CLOSED | RELOCATED | PENDING | REJECTED
category         VARCHAR(50) DEFAULT 'TONKATSU' -- V2 확장 대비
vote_count       INT DEFAULT 0                 -- 비정규화 캐시
relocated_to_id  BIGINT FK -> Restaurant (nullable)  -- 이전 시 새 가게 연결 (RELOCATED 전용)
closed_at        TIMESTAMP (nullable)          -- 폐업 시점 (CLOSED 전용, 관측에도 유용)
created_by       BIGINT FK -> User (nullable)
created_at       TIMESTAMP
updated_at       TIMESTAMP

INDEX idx_status_vote_count (status, vote_count DESC)  -- 서울 단일 랭킹 조회 핵심
INDEX idx_lat_lng (latitude, longitude)                -- 지도 핀 표시용
INDEX idx_category (category)
```

> 💡 **`relocated_to_id`·`closed_at`은 MVP에서 로직을 다 짜지 않더라도 컬럼은 처음부터 둔다.** 데이터가 쌓인 뒤 컬럼 추가는 마이그레이션 비용이 크지만, 지금은 공짜다.

### Vote
```
id            BIGINT PK
user_id       BIGINT FK -> User NOT NULL
restaurant_id BIGINT FK -> Restaurant NOT NULL
voted_at      TIMESTAMP
is_current    BOOLEAN DEFAULT TRUE
version       BIGINT                          -- @Version 낙관적 락
                                              -- (※ 락은 Restaurant.vote_count에 적용, 아래 참조)

PARTIAL UNIQUE INDEX (user_id) WHERE is_current = TRUE  -- 1인 1표 DB 레벨 보장
INDEX idx_user_voted_at (user_id, voted_at DESC)
INDEX idx_restaurant_current (restaurant_id, is_current)
```

> 💡 **표 이동 동작** (단일 트랜잭션, VoteService):
> 1. 트랜잭션 시작
> 2. 기존 Vote의 `is_current = false` UPDATE
> 3. 기존 Restaurant `vote_count -= 1`
> 4. 새 Vote INSERT (`is_current = true`)
> 5. 새 Restaurant `vote_count += 1`
> 6. User `current_vote_id` 갱신
> 7. 커밋
>
> 동시성: Restaurant.`vote_count`에 `@Version` 낙관적 락 적용. 충돌 시 재시도(`@Retryable` 또는 수동 루프). 1인 1표 자체는 `PARTIAL UNIQUE INDEX (user_id) WHERE is_current = TRUE`로 DB가 최종 보장. (상세 설계는 백엔드 아키텍처 문서에서 다룸.)

---

## 3. 식별·상태·폐업 정책 (확정)

### 3.1 가게 식별 — `kakao_place_id` UNIQUE

- 1차 방어선: `kakao_place_id` UNIQUE. 카카오 레코드 중복 등록 차단.
- 카카오 place ID는 "물리적 가게"가 아니라 "카카오 DB의 등록 레코드"를 가리킴 → 현실 가게가 여러 ID로 존재할 수 있으나, MVP에서는 이를 100% 막지 않음(오버엔지니어링).
- 현실 중복(드묾)은 운영자가 수동 병합. 반경 기반 중복 경고는 V1.1 이후 검토.

### 3.2 체인점 — 지점 = 독립된 가게

- **각 지점을 별개의 Restaurant로 둔다.** 본점/분점 구별·병합 안 함.
- 근거: (1) 지도 기반 서비스라 지점을 합치면 핀을 어디 꽂을지 모호, (2) 지점마다 맛이 다름 — "인생 돈까스"는 특정 한 그릇의 경험이지 브랜드 충성도가 아님.
- 카카오가 지점별로 다른 place_id를 발급하므로 `kakao_place_id UNIQUE`가 자동으로 지점을 구분. **추가 수동 작업 없음.**
- 브랜드 묶기(프랜차이즈명 그룹화)는 V2 추천 기능에서 필요해지면 도입. MVP에는 `brand_name` 컬럼도 두지 않음.

### 3.3 폐업·이전 — A+C 정책 (확정)

- **폐업(CLOSED) = 박제(A안)**: 투표는 막되 기존 표·히스토리는 보존. 랭킹에서 제외. 마이페이지에는 "폐업한 ○○"로 표시. → "표 = 진심의 기록" 컨셉에 충실.
- **이전(RELOCATED) = 승계(C안)**: 같은 가게의 위치 이동이므로 새 레코드(새 place_id)로 표를 이관. `relocated_to_id`로 연결.
- 폐업·이전 **감지는 MVP에서 운영자 수동**. 자동 감지(카카오 place_url 주기 점검)는 V2급. 사용자 신고("문 닫았어요")는 V1.1 검토.
- 투표·랭킹 쿼리는 기본 `WHERE status = 'ACTIVE'`. Vote 조회(히스토리·마이페이지)는 status 무관으로 분리.

---

## 4. 화면 구성 (MVP)

> 프론트는 React(Next.js) SPA. 아래는 라우트(프론트) 기준이며 백엔드는 REST API만 제공.

1. **메인** (`/`) — 지도(핀) + **서울 단일 랭킹** 패널 (1위 강조). 지도는 탐색·핀 보기 용도, 랭킹의 주인공은 서울 전체 단일 랭킹.
2. **가게 상세** (`/restaurants/{id}`) — 정보 + 투표
3. **가게 추가** (`/restaurants/new`) — 카카오맵 검색 → 등록
4. **마이페이지** (`/me`) — 현재 1순위 + 표 이동 히스토리
5. **약관 / 개인정보처리방침** (`/terms`, `/privacy`)

> ※ OAuth 콜백은 프론트 화면이 아니라 백엔드 엔드포인트(`/login/oauth2/code/kakao`)에서 처리 후 프론트로 리다이렉트.

---

## 5. API 엔드포인트 (초안)

> 모든 API에 버전 접두어 `/api/v1` 적용 (지금 한 줄 비용, 나중에 전부 수정 방지).

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/v1/ranking` | **서울 단일 랭킹** 조회 (vote_count DESC, status=ACTIVE) |
| GET | `/api/v1/ranking/top` | 현재 서울 1위 (왕좌) 단건 조회 |
| GET | `/api/v1/restaurants` | 지도 핀용 가게 목록 (좌표 포함, status=ACTIVE) |
| GET | `/api/v1/restaurants/{id}` | 가게 상세 |
| POST | `/api/v1/restaurants` | 가게 추가 (카카오맵 place_id 기반) |
| GET | `/api/v1/restaurants/search` | 자체 DB 이름 검색 |
| GET | `/api/v1/kakao-places/search` | 카카오 로컬 API 프록시 (가게 추가용) |
| POST | `/api/v1/votes` | 투표 / 표 이동 |
| GET | `/api/v1/me` | 내 정보 + 현재 1순위 |
| GET | `/api/v1/me/vote-history` | 표 이동 히스토리 |

---

## 6. 주요 기술적 결정

### 6.1 랭킹 = 서울 단일 랭킹 (뷰포트 랭킹 폐기)

- **이 서비스의 랭킹은 단 하나: 서울 전체 단일 랭킹.** 1위가 "왕좌"이며 제품의 주인공.
- `vote_count DESC` 정렬 + `status = 'ACTIVE'` 필터. `idx_status_vote_count` 인덱스 활용.
- v0.1의 `bounds`(뷰포트) 파라미터 기반 동적 랭킹은 **폐기.** 지도는 핀 표시·탐색 용도이지 별도 랭킹 산출 기준이 아님.
- 지도 핀 목록(`/restaurants`)과 랭킹(`/ranking`)은 책임이 다르므로 엔드포인트 분리.

### 6.2 카테고리 화이트리스트

가게 등록 시 카카오 카테고리 검사:
- "돈까스", "돈가스", "경양식" 중 하나라도 포함하면 ACTIVE
- 아니면 REJECTED + 사용자에게 사유 안내

### 6.3 실시간 = 30초 폴링

- 프론트가 30초 간격으로 `/api/v1/ranking` 재호출.
- 페이지 가시성 API로 백그라운드 탭은 폴링 중지 (서버 부담↓).
- 진짜 실시간(WebSocket)은 V1.1+ 검토.

### 6.4 카카오 로컬 API 호출 최소화

- 가게 등록 시에만 카카오 API 호출.
- 등록 후엔 자체 DB에서 조회 (카카오 API 매번 호출 X).
- 카카오 API 응답 캐시 (Redis 안 쓰고 인메모리 Caffeine으로 충분).

### 6.5 가상 스레드

- `spring.threads.virtual.enabled: true`. 30초 폴링 + 카카오 API I/O 대기가 많은 워크로드라 가상 스레드가 실효.

---

## 7. 관측(Observability) — 초기 풀세팅 방침

> 철학: **기능은 MVP로 얇게, 관측은 처음부터 두껍게.** 초기 사용자·부하·표 이동 패턴은 그 순간이 지나면 영원히 못 얻는 데이터이므로, "나중에 못 얻는 데이터"는 day 1부터 잡는다.

**Day 1 필수 (코드에 박혀서 나중에 넣기 비싼 것)**
- 구조화 로깅(JSON, `logstash-logback-encoder`) + 요청 추적 ID(traceId, MDC).
- 핵심 비즈니스 이벤트 명시적 로그: 투표·표 이동·가게 등록·카카오 API 호출/실패.
- Spring Boot Actuator + Micrometer (`/actuator/health`, `/actuator/metrics`), Prometheus 포맷 노출.
- 커스텀 메트릭: 투표 수·표 이동 횟수·활성 사용자·카카오 API 응답시간/실패율·락 충돌 횟수.
- Vote 히스토리 보존(이미 `is_current` 설계가 충족) → 초기 행동 데이터 영구 기록.

**출시 전 추가 (나중에 붙여도 싼 것)**
- Sentry 무료 티어 (예외 자동 수집).
- Grafana Cloud 무료 티어 연결 + 대시보드.

**일부러 뺀 것 (트래픽 생긴 뒤)**: 유료 APM, 직접 운영 ELK, 분산 트레이싱 풀세팅.

---

## 8. 미결정 사항

- [ ] 세션 저장소 구체안: `spring-session-jdbc`(PostgreSQL)로 시작 vs Redis 도입 시점
- [ ] CI/CD 방법 (GitHub Actions vs 호스팅 자체 빌드)
- [ ] 응답 포맷: 공통 `ApiResponse` 래퍼 vs 순수 데이터 + HTTP 상태코드 (프론트 개발자와 컨벤션 합의 필요)
- [ ] 도메인 최종 등록 시점 (출시 직전)

---

## 변경 이력

- **v0.1 (2026-05-11)**: 초안 작성.
- **v0.2 (2026-06-04)**: 백엔드 아키텍처 방향 확정 반영.
  - 프론트 React(Next.js) + 순수 REST API 전환 (Thymeleaf+HTMX 폐기).
  - 인증을 외부저장소 세션으로 확정(JWT 미채택), SPA용 OAuth 콜백·CORS·CSRF 정책 추가.
  - **랭킹을 서울 단일 랭킹으로 확정**, 뷰포트(`bounds`) 기반 랭킹 폐기. 랭킹/핀 엔드포인트 분리.
  - Restaurant 상태 모델 확장(CLOSED/RELOCATED 추가), 폐업=박제·이전=승계(A+C) 정책, `relocated_to_id`·`closed_at` 컬럼 추가.
  - 체인점=독립 식당 정책 명시(본점 구별·병합 안 함).
  - 식별 정책(`kakao_place_id` UNIQUE) 근거·한계 명문화.
  - 기술 스택 갱신: Java 21·가상 스레드·RestClient·Flyway·UTC 저장·API 버저닝.
  - 관측 초기 풀세팅 방침(섹션 7) 신설.
