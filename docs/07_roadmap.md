# 카츠랭 — 개발 로드맵 & 진행 상황

- **버전**: v0.4
- **갱신일**: 2026-07-02

> 이 파일이 개발 진행의 진실 기록이다.
> 완료되면 `[x]`, 진행 중이면 `[~]`, 미정이면 `[ ]`.
> 날짜는 완료/시작 시점에 직접 채운다.

---

## 마일스톤 전체 보기

| 단계 | 이름 | 상태 | 완료일 |
|---|---|---|---|
| M1 | 백엔드 API v1 | ✅ 완료 | 2026-06 |
| M2 | 서버 배포 (백엔드, 수동) | ✅ 완료 (자동 배포는 다음 단계) | 2026-07-02 |
| M3 | 프론트엔드 개발 | 🚧 진행 중 | - |
| M4 | 프론트엔드 배포 | ⬜ 대기 | - |
| M5 | 데이터 시딩 (가게 20곳) | ⬜ 대기 | - |
| M6 | 소프트 런치 | ⬜ 대기 | - |

---

## M1. 백엔드 API v1 ✅

- [x] 프로젝트 세팅 (Spring Boot 4.0, Java 21, Gradle, Flyway)
- [x] 카카오 OAuth2 로그인
- [x] spring-session-jdbc (외부 세션 저장소)
- [x] Restaurant 엔티티 + CRUD
- [x] Vote 도메인 (1인 1표 + 이동 + 동시성 처리)
- [x] 랭킹 API (서울 단일 랭킹)
- [x] 가게 검색 API (카카오 로컬 API 연동)
- [x] 마이페이지 API (내 정보 + 투표 히스토리)
- [x] 가게 폐업/이전 상태 관리 API
- [x] QueryDSL 도입 (복잡한 랭킹·히스토리 쿼리)
- [x] Controller/Service 통합 테스트
- [x] Postman 컬렉션 작성

---

## M2. 서버 배포 (백엔드) ✅ — 수동 배포 완료, CI/CD 자동화는 의도적으로 다음 단계로 미룸

> 실무에서 널리 쓰는 EC2로 인프라를 직접 손으로 구성해보는 학습 목적. 자동 배포(GitHub Actions)는
> 처음부터 만들지 않고, 수동 배포 흐름을 완전히 익힌 뒤에 도입하기로 결정함 (의도된 단계적 전환).

### 사전 준비
- [x] AWS 계정 생성
- [x] Cloudflare 계정 생성
- [x] 로컬 SSH 키 확인/생성

### 1단계 — 도메인
- [x] `katsurank.kr` 도메인 구매 (Gabia)
- [x] Cloudflare에 도메인 추가
- [x] Gabia 네임서버 → Cloudflare로 변경
- [x] Cloudflare Active 확인

### 2단계 — 서버 프로비저닝
- [x] AWS EC2 인스턴스 생성 (t2.micro, Ubuntu 24.04)
- [x] Security Group: 22/80/443 포트 허용
- [x] Elastic IP 할당 + 연결
- [x] SSH 접속 확인

### 3단계 — 서버 초기 설정
- [x] Java 21 설치
- [x] PostgreSQL 설치
- [x] DB + 유저 생성
- [x] Nginx 설치
- [x] Certbot 설치
- [x] 앱 배포 디렉토리 생성

### 4단계 — 앱 실행 환경
- [x] 환경변수 설정 (DB·카카오 OAuth 시크릿 등)
- [x] /etc/systemd/system/katsurank.service 등록
- [x] systemctl enable katsurank (재부팅 후 자동 기동 확인됨)

### 5단계 — CI/CD
- [ ] GitHub Secrets 14개 등록 — **미착수, 다음 단계**
- [x] 첫 수동 배포 + 헬스체크 확인
- [ ] deploy.yml push → Actions 자동 실행 확인 — **미착수, 다음 단계**

### 6단계 — HTTPS + 도메인
- [x] DNS A 레코드 추가 (Elastic IP)
- [x] DNS 전파 확인
- [x] API 문서(Swagger UI) Basic Auth 계정 생성 (htpasswd)
- [x] Nginx 설정 파일 작성 (Swagger UI/OpenAPI 경로 포함)
- [x] Certbot SSL 인증서 발급
- [x] Cloudflare 연결 상태 확인 — **현재 DNS only(회색 구름), Proxy(주황 구름) 미사용**

### 7단계 — 카카오 연동
- [x] 카카오 디벨로퍼스: 사이트 도메인 추가
- [x] 카카오 디벨로퍼스: Redirect URI 추가
- [x] 카카오 로그인 종단 간 테스트 (401 이슈는 쿠키 도메인 수정으로 해결)

### 완료 확인
- [x] `curl https://api.katsurank.kr/actuator/health` → `{"status":"UP"}`
- [x] `curl https://api.katsurank.kr/api/v1/ranking` → 200 응답, 빈 배열 (가게 데이터가 아직 없어서 정상 — M5 데이터 시딩 전이라 예상된 결과)

---

## M3. 프론트엔드 개발 🚧

> 협업자(oljyee)가 진행 중. 아래 체크리스트는 상위 항목만 갱신함 — 페이지별 mock/실연동 상세 현황은 이번 갱신에서 다루지 않음.

- [x] Vite + React Router 프로젝트 세팅
- [ ] 카카오 로그인 연동
- [ ] 랭킹 페이지 (서울 단일 랭킹)
- [ ] 가게 상세 페이지
- [ ] 투표 / 투표 이동
- [ ] 마이페이지
- [ ] 가게 검색 (카카오맵 JS SDK)

---

## M4. 프론트엔드 배포 ⬜

- [ ] Vercel 배포
- [ ] 환경변수 설정
- [ ] CORS 업데이트 (백엔드 APP_CORS_ALLOWED_ORIGINS에 Vercel 도메인 추가)

---

## M5. 데이터 시딩 ⬜

- [ ] 서울 돈까스 맛집 20곳 선별
- [ ] SQL INSERT 스크립트 작성
- [ ] 카카오맵으로 위치 검증
- [ ] 프로덕션 DB에 시딩

---

## M6. 소프트 런치 ⬜

- [ ] 지인 테스트 (5명)
- [ ] 피드백 반영
- [ ] 공개 런치 (SNS)

---

## 열린 결정 (결정되면 여기서 지운 후 03 문서에 반영)

| 항목 | 상태 | 비고 |
|---|---|---|
| 응답 포맷 | ❓ 미정 | ApiResponse 래퍼 vs 순수 데이터 |
| 프론트 배포 위치 | ❓ 미정 | Vercel 유력 |
| 개인정보처리방침 페이지 | ❓ 미정 | 카카오 디벨로퍼스 필수 |

---

## 변경 이력

- **v0.1 (2026-06-28)**: 최초 작성. M1 완료 기록, M2 체크리스트 상세화.
- **v0.2 (2026-07-01)**: M2 인프라 변경 — Oracle Cloud → AWS EC2, CloudFlare 표기 통일. 프론트 전달용 API 문서(springdoc-openapi/Swagger UI) 도입, Nginx Basic Auth로 문서 경로 보호.
- **v0.3 (2026-07-02)**: M2(서버 배포) 실제 완료 상태 반영 — EC2/Nginx/systemd/HTTPS/DNS/카카오 OAuth 전부 동작 확인. CI/CD(5단계)는 의도적으로 미착수 상태(수동 배포 먼저 → 자동 배포 순서로 진행 예정). Cloudflare는 DNS only(Proxy 미사용) 확인. `/api/v1/ranking` curl 확인 — 200 + 빈 배열(가게 데이터 미시딩 상태라 정상).
- **v0.4 (2026-07-02)**: M3(프론트엔드 개발) 상태를 "대기"→"진행 중"으로 정정 — 협업자(oljyee)가 이미 Vite+React Router로 페이지 대부분을 마크업하고 일부는 실제 API 연동까지 진행함. "Next.js 프로젝트 세팅" 항목을 실제 스택(Vite+React Router) 기준으로 정정.
