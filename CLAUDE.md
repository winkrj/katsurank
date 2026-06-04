# 카츠랭 (katsurank)

서울 돈까스 1인 1표 랭킹 서비스. 사용자는 평생 단 한 집에 투표하고, 더 맛있는 곳을 찾으면 표를 옮긴다.
랭킹은 **서울 전체 단일 랭킹 하나뿐**이며, 서울 1위가 "왕좌"다.

## SSOT 문서 (필요할 때만 해당 파일을 Read 할 것 — 전체를 한 번에 읽지 말 것)

- 데이터 모델 · API · 기술 결정: `docs/03_data_model_and_tech.md` ← 백엔드 작업 1순위
- 기능 범위 (V1 / V1.1 / V2): `docs/02_mvp_scope.md`
- 제품 컨셉 · 정책: `docs/01_product_spec.md`
- 프로젝트 전체 요약: `docs/00_index.md`

작업과 관련된 문서만 열어라. 세부 스펙이 필요할 때 03을 우선 참조한다.

## 절대 제약 (어기지 말 것)

- 백엔드는 **순수 REST API** (`/api/v1/...`). Thymeleaf · 서버사이드 렌더링 금지.
- 인증: 카카오 OAuth2 + **외부저장소 세션** (spring-session-jdbc). **JWT 사용 금지.**
- CSRF는 **처음부터 켠다** (Double Submit Cookie). 끄지 말 것.
- 랭킹은 **서울 단일 랭킹 1개**. 뷰포트(bounds) 기반 랭킹을 만들지 말 것.
- 가게(Restaurant)는 **hard delete 금지.** status로만 관리 (ACTIVE/CLOSED/RELOCATED/PENDING/REJECTED).
- 폐업 = 박제(표 보존, 랭킹 제외), 이전 = 승계(relocated_to_id로 새 레코드에 표 이관).
- 체인점 = 지점마다 독립된 Restaurant. 본점 구별 · 병합 금지.
- 시각은 **UTC로 저장**, 표시 시점에만 KST 변환.

## 기술 스택

- Java 21 (LTS) + 가상 스레드 (`spring.threads.virtual.enabled: true`)
- Spring Boot 4.0.x, Gradle Kotlin DSL
- JPA(Hibernate) + PostgreSQL, **Flyway**로 스키마 관리 (ddl-auto 의존 금지)
- HTTP 클라이언트는 **RestClient** (RestTemplate · WebClient 금지)
- 카카오 OAuth / 카카오맵 JS SDK / 카카오 로컬 API

## 코드 컨벤션

- 두꺼운 도메인 모델: 비즈니스 로직은 엔티티 안에 (`Vote.moveTo(...)` 식). setter 남발 금지.
- 3계층: Controller → Service → Repository. 트랜잭션 경계는 Service 메서드.
- 엔티티를 JSON 응답으로 직접 노출 금지. 항상 DTO로 변환.
- DTO는 record로. 자바 최신 문법(record, sealed) 적극 활용.

## 빌드 / 실행

- 로컬 DB: `docker compose up -d`
- 실행: `./gradlew bootRun`
- 테스트: `./gradlew test`

<!-- 영역별 상세 규칙은 .claude/rules/ 에 경로 스코프로 분리되어, 해당 코드를 만질 때만 로드됨 -->
