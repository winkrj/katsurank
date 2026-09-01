# 데이터 모델 & 기술 결정

- **버전**: v0.6
- **작성일**: 2026-09-01
- **상태**: 백엔드 아키텍처 방향 확정. 최신 브랜치 통합 상태는 `09_current_status.md` 참조.

> v0.1 대비 주요 변경: 프론트가 React(Vite + React Router) + 순수 REST API로 전환됨에 따라 인증·화면·API 구조가 바뀌었고, "서울 단일 랭킹" 확정으로 뷰포트 기반 랭킹 설계가 폐기됨. Restaurant 상태 모델·폐업/이전 정책이 추가됨. 자세한 변경은 맨 아래 변경 이력 참조.

---

## 1. 기술 스택 (확정)

| 영역 | 선택 | 이유 |
|---|---|---|
| 백엔드 | Spring Boot 4.0.x / Java 21 (LTS) | 본인 현업 경력, 가상 스레드 활용 |
| ORM | JPA (Hibernate) | Spring Boot 표준 |
| DB | PostgreSQL | 무료 호스팅 무난, JSON 지원 |
| DB 마이그레이션 | Flyway | 협업·배포 환경 스키마 안정성 (ddl-auto 의존 제거) |
| 프론트 | React (Vite, React Router v7, TypeScript, Tailwind) | 별도 프론트 개발자 협업, Vercel 배포 |
| HTTP 클라이언트 | RestClient (Spring 6.1+) | 동기 호출에 단순·최신, RestTemplate 대체 |
| 지도 | 카카오맵 JS SDK | 한국 데이터 최강, 무료 한도 충분 |
| 가게 검색 API | 카카오 로컬 API | 일 30만 건 무료 |
| 인증 | 카카오 OAuth2 + 외부저장소 세션 (Spring Security / Spring Session) | 가입 마찰 최소, 서버 측 세션 종료와 향후 강제 무효화 확장 가능 |
| 백엔드 호스팅 | AWS EC2 | t2.micro, Nginx + systemd (최종 확정, Railway·Oracle Cloud 거쳐 변경) |
| 프론트 호스팅 | Vercel | Vite SPA 정적 배포, 무료 티어 |
| 공개 주소 | https://www.katsurank.kr | Vercel 프론트, 별도 API 도메인 |

### 1.1 인증 방식 — 외부저장소 세션 (확정, JWT 아님)

- 카카오 OAuth2 로그인 성공 후 **세션 쿠키**(HttpOnly, SameSite) 발급.
- 세션은 톰캣 인메모리가 아니라 **외부 저장소**(`spring-session-jdbc`로 PostgreSQL, 또는 추후 Redis)에 저장 → 서버를 수평 확장해도 세션 공유, 재배포에도 유지.
- JWT를 쓰지 않는 이유: 단일 백엔드 + 자체 SPA 구조에서 JWT의 무상태성보다 서버가 로그아웃과 세션
  종료를 통제하는 편이 중요하다고 판단했다. 현재는 사용자 로그아웃·해당 세션 종료를 구현했고,
  계정 차단·전체 세션 일괄 무효화는 별도 운영 기능이 필요하다.
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
- CORS: 프론트 오리진(`https://www.katsurank.kr`, 로컬 `http://localhost:5173`)만 허용,
  `allowCredentials(true)`.
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

### Comment
```
id            BIGINT PK
restaurant_id BIGINT FK -> Restaurant NOT NULL
user_id       BIGINT FK -> User NOT NULL
content       VARCHAR(500) NOT NULL
created_at    TIMESTAMP NOT NULL
updated_at    TIMESTAMP NOT NULL

UNIQUE (restaurant_id, user_id)                         -- 가게별 1인 1댓글
INDEX idx_comments_restaurant_created
      (restaurant_id, created_at DESC, id DESC)         -- 최신 작성순 조회
```

- 댓글 목록은 공개하고 작성·수정·삭제는 로그인 사용자만 가능하다.
- ACTIVE 가게에서만 작성·수정하며 CLOSED/RELOCATED 가게의 기존 댓글은 조회·삭제할 수 있다.
- 작성자가 삭제한 댓글은 hard delete한다. Restaurant/Vote 영구 보존 정책은 댓글에 적용하지 않는다.
- 좋아요·대댓글·신고·관리자 모더레이션·수정 이력은 V1 범위가 아니다.

### RankingDailySnapshot
```
snapshot_date DATE NOT NULL                              -- KST 기준 날짜
restaurant_id BIGINT FK -> Restaurant NOT NULL
rank          INT NOT NULL
vote_count    INT NOT NULL
captured_at   TIMESTAMP NOT NULL                         -- UTC

PRIMARY KEY (snapshot_date, restaurant_id)
INDEX idx_ranking_daily_snapshots_restaurant_date
      (restaurant_id, snapshot_date DESC)

ranking_daily_snapshot_runs
snapshot_date DATE PK                                     -- 날짜별 실행 선점·완료 마커
captured_at   TIMESTAMP NOT NULL                          -- UTC
```

- 매일 `00:00 Asia/Seoul`에 ACTIVE 가게 전체를 대상으로 서울 단일 랭킹을 기록한다.
- 동점은 현재 랭킹과 같은 경쟁 순위(`1, 2, 2, 4`)를 사용한다.
- 날짜별 실행 마커를 먼저 선점하므로 ACTIVE 가게가 0개인 날과 다중 인스턴스 동시 실행도 한 번만 완료한다. 같은 날짜 재실행은 기존 값을 덮어쓰지 않으며, 누락된 날짜를 합성하거나 과거 표로 역산하지 않는다.
- 폐업·이전 후 새 스냅샷은 만들지 않지만 기존 기록은 보존한다.

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

> 프론트는 React(Vite) SPA이며 백엔드는 REST API만 제공한다.

1. **메인** (`/`) — 지도, 서울 단일 랭킹, 검색, 내 표를 한 화면에 통합한다.
2. **가게 상세** — 별도 route가 아니라 데스크톱 sidebar·모바일 modal로 열고 `?restaurant={id}` 딥링크를 사용한다.
3. **가게 추가** — 메인 지도 위 3단계 modal에서 처리한다.
4. **내 표** — 별도 마이페이지 없이 랭킹 영역의 카드와 상세 연결로 제공한다.
5. **약관 / 개인정보처리방침** (`/terms`, `/privacy`)은 공개 별도 route로 유지한다.

> ※ OAuth 콜백은 프론트 화면이 아니라 백엔드 엔드포인트(`/login/oauth2/code/kakao`)에서 처리 후 프론트로 리다이렉트.

---

## 5. API 엔드포인트

> 모든 API에 버전 접두어 `/api/v1` 적용 (지금 한 줄 비용, 나중에 전부 수정 방지).

> **아래 표는 개요용이며 최신 상태가 아닐 수 있다.** 요청/응답 스키마를 포함한 정확한 최신 스펙은
> 배포된 Swagger UI를 참고한다 — `https://api.katsurank.kr/swagger-ui.html` (Basic Auth 필요,
> 자격증명은 별도 채널로 전달). 로컬은 `http://localhost:8080/swagger-ui.html`.

> **페이지네이션·목록 응답 컨벤션**: 목록을 반환하는 API는 요청 파라미터로 `offset`(기본 0)·`limit`을 받고,
> 응답은 공통 포맷 `{ items, total, offset, limit }`(`PageResponse<T>`)을 따른다. `items`/`total` 필드명은
> 모든 목록 API에서 동일하다. 카카오 장소 검색도 카카오 원본은 `page` 기반이지만, 우리 API 표면은
> 서버에서 offset/limit로 변환해 동일한 컨벤션을 유지한다. 전체를 그대로 보여줘야 하는 지도 핀
> 목록(`map-pins`)만 예외로 페이지네이션 없이 순수 배열을 반환한다.

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/v1/ranking` | **서울 단일 랭킹** 목록 조회 (vote_count DESC, status=ACTIVE, offset/limit 페이지네이션) |
| GET | `/api/v1/ranking/stream` | TOP 20 랭킹 스냅샷 SSE 스트림 |
| GET | `/api/v1/ranking/top` | 현재 서울 1위 (왕좌) 단건 조회 |
| GET | `/api/v1/ranking/map-pins` | 지도 핀용 가게 좌표 목록 (status=ACTIVE, 페이지네이션 없이 전체 반환) |
| GET | `/api/v1/restaurants/{id}` | 가게 상세 (status 무관, 폐업/이전된 가게도 조회 가능) |
| GET | `/api/v1/restaurants/{id}/comments` | 가게 댓글 목록 (공개, offset/limit 페이지네이션) |
| POST | `/api/v1/restaurants/{id}/comments` | 가게 댓글 작성 (로그인 필요, 가게별 1인 1댓글) |
| PATCH | `/api/v1/restaurants/{id}/comments/{commentId}` | 본인 댓글 수정 (로그인 필요) |
| DELETE | `/api/v1/restaurants/{id}/comments/{commentId}` | 본인 댓글 삭제 (로그인 필요) |
| GET | `/api/v1/restaurants/{id}/ranking-history` | KST 일별 서울 순위 스냅샷 최근 7건 (날짜 오름차순) |
| POST | `/api/v1/restaurants` | 가게 등록 (카카오 place_id 기반, 로그인 필요) |
| GET | `/api/v1/restaurants/search` | 자체 DB 이름 검색 (status=ACTIVE만, q는 선택 — 없으면 전체 목록, vote_count 순 offset/limit 페이지네이션) |
| PATCH | `/api/v1/restaurants/{id}/close` | 가게 폐업 처리 (박제, 로그인 필요) |
| PATCH | `/api/v1/restaurants/{id}/relocate` | 가게 이전 처리 (표 승계, 로그인 필요) |
| GET | `/api/v1/kakao-places/search` | 카카오 로컬 API 프록시 (가게 추가용). offset/limit 페이지네이션(내부적으로 카카오 원본 page로 변환) |
| POST | `/api/v1/votes` | 투표 / 표 이동 (로그인 필요) |
| GET | `/api/v1/auth/me` | 로그인 상태 확인 |
| GET | `/api/v1/auth/csrf` | CSRF 토큰 발급 (SPA 부트스트랩용) |
| POST | `/api/v1/auth/logout` | 로그아웃 |
| GET | `/api/v1/me` | 내 정보 + 현재 1순위 |
| GET | `/api/v1/me/vote-history` | 표 이동 히스토리 (최신순, offset/limit 페이지네이션) |

---

## 6. 주요 기술적 결정

### 6.1 랭킹 = 서울 단일 랭킹 (뷰포트 랭킹 폐기)

- **이 서비스의 랭킹은 단 하나: 서울 전체 단일 랭킹.** 1위가 "왕좌"이며 제품의 주인공.
- `vote_count DESC` 정렬 + `status = 'ACTIVE'` 필터. `idx_status_vote_count` 인덱스 활용.
- v0.1의 `bounds`(뷰포트) 파라미터 기반 동적 랭킹은 **폐기.** 지도는 핀 표시·탐색 용도이지 별도 랭킹 산출 기준이 아님.
- 지도 핀 목록(`/restaurants`)과 랭킹(`/ranking`)은 책임이 다르므로 엔드포인트 분리.

### 6.2 카테고리 화이트리스트 · 서울 지역 검증

가게 등록 시 카카오 카테고리 검사:
- "돈까스", "돈가스", "돈카츠", "경양식" 중 하나라도 포함하면 ACTIVE
- 아니면 REJECTED + 사용자에게 사유 안내

가게 등록 시 주소(지번 또는 도로명) 검사:
- "서울"로 시작하지 않으면 REJECTED + 사용자에게 사유 안내 (서울 단일 랭킹이므로 서울 밖 가게는 등록 대상 아님)
- 카카오 장소 검색 프록시(`GET /api/v1/kakao-places/search`)도 `rect`(서울 사각 영역) + 같은 주소 접두어 검사로 미리 걸러 검색 결과 단계에서부터 서울 밖 결과를 줄인다

### 6.3 실시간 = TOP 20 캐시 + SSE 스냅샷

- 기존 REST `/api/v1/ranking` 계약은 유지한다.
- 백엔드는 TOP 20을 인메모리 캐시하고 cache hit 경로에서는 읽기 트랜잭션을 열지 않는다.
- 투표·표 이동 커밋 뒤 변경 마커를 남기고, 다음 캐시 갱신에서 versioned TOP 20 스냅샷을 만든다.
- SSE `vote-changed` 이벤트는 version, changedAt, generatedAt, items를 포함한다.
- 느린 클라이언트는 연결별 비동기 전송으로 격리하고, 밀린 스냅샷은 최신 version으로 합친다.
- 단일 인스턴스 V1은 인메모리 연결 관리를 사용한다. 다중 인스턴스 전환 시 외부 이벤트 브로커를 검토한다.
- 최신 프론트의 이벤트 이름 정렬과 통합 검증은 `09_current_status.md`의 V1 체크리스트에 남아 있다.
- 프론트 REST 목록은 TOP 100까지 표시할 수 있어, TOP 20 snapshot을 cache에 병합하는 범위 정책도
  통합 전에 확정한다.

### 6.4 카카오 로컬 API 호출 최소화

- 가게 등록 시에만 카카오 API 호출.
- 등록 후엔 자체 DB에서 조회 (카카오 API 매번 호출 X).
- 카카오 API 응답 캐시 (Redis 안 쓰고 인메모리 Caffeine으로 충분).

### 6.5 가상 스레드

- `spring.threads.virtual.enabled: true`. 카카오 API, DB, 다수 SSE 연결처럼 I/O 대기가 많은 단일 인스턴스 워크로드에서 플랫폼 스레드 점유를 줄인다.

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

- [x] 세션 저장소: `spring-session-jdbc`(PostgreSQL)로 시작, 실제 병목이 확인될 때 Redis 검토
- [x] CI/CD: GitHub Actions 자동 배포
- [x] 응답 포맷: HTTP 상태코드를 유지하면서 성공·실패 본문을 공통 `ApiResponse<T>` 래퍼로 통일
- [x] 공개 도메인과 프론트 배포: `https://www.katsurank.kr`

---

## 변경 이력

- **v0.1 (2026-05-11)**: 초안 작성.
- **v0.2 (2026-06-04)**: 백엔드 아키텍처 방향 확정 반영.
- **v0.3 (2026-07-01)**: 5절 API 엔드포인트 표를 실제 코드에 맞게 정정(폐업/이전·auth 엔드포인트 추가). 정확한 스펙은 Swagger UI(springdoc-openapi)를 SSOT로 안내.
  - 프론트 React(Next.js) + 순수 REST API 전환 (Thymeleaf+HTMX 폐기).
  - 인증을 외부저장소 세션으로 확정(JWT 미채택), SPA용 OAuth 콜백·CORS·CSRF 정책 추가.
  - **랭킹을 서울 단일 랭킹으로 확정**, 뷰포트(`bounds`) 기반 랭킹 폐기. 랭킹/핀 엔드포인트 분리.
  - Restaurant 상태 모델 확장(CLOSED/RELOCATED 추가), 폐업=박제·이전=승계(A+C) 정책, `relocated_to_id`·`closed_at` 컬럼 추가.
  - 체인점=독립 식당 정책 명시(본점 구별·병합 안 함).
  - 식별 정책(`kakao_place_id` UNIQUE) 근거·한계 명문화.
  - 기술 스택 갱신: Java 21·가상 스레드·RestClient·Flyway·UTC 저장·API 버저닝.
  - 관측 초기 풀세팅 방침(섹션 7) 신설.
- **v0.4 (2026-07-02)**: 프론트 스택 표기 정정 (Next.js → Vite + React Router v7, 실제 구현 기준). 백엔드 호스팅 표기 정정 (Railway → AWS EC2, 실제 배포 기준 — 06_deployment_guide.md·07_roadmap.md와 일치).
- **v0.5 (2026-09-01)**: 30초 polling 설명을 실제 TOP 20 캐시 + versioned SSE 스냅샷 구조로 갱신하고 stream API 및 통합 대기 상태를 반영.
- **v0.6 (2026-09-01)**: 가게별 1인 1댓글 데이터·API 정책과 KST 자정 일별 서울 순위 스냅샷 데이터·조회 API를 추가.
