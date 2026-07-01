# 카츠랭 — 개발 로드맵 & 진행 상황

- **버전**: v0.1
- **갱신일**: 2026-06-28

> 이 파일이 개발 진행의 진실 기록이다.
> 완료되면 `[x]`, 진행 중이면 `[~]`, 미정이면 `[ ]`.
> 날짜는 완료/시작 시점에 직접 채운다.

---

## 마일스톤 전체 보기

| 단계 | 이름 | 상태 | 완료일 |
|---|---|---|---|
| M1 | 백엔드 API v1 | ✅ 완료 | 2026-06 |
| M2 | 서버 배포 (백엔드) | 🔄 진행 중 | - |
| M3 | 프론트엔드 개발 | ⬜ 대기 | - |
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

## M2. 서버 배포 (백엔드) 🔄

### 사전 준비
- [ ] AWS 계정 생성
- [ ] Cloudflare 계정 생성
- [ ] 로컬 SSH 키 확인/생성

### 1단계 — 도메인
- [ ] `katsurank.kr` 도메인 구매 (Gabia)
- [ ] Cloudflare에 도메인 추가
- [ ] Gabia 네임서버 → Cloudflare로 변경
- [ ] Cloudflare Active 확인

### 2단계 — 서버 프로비저닝
- [ ] AWS EC2 인스턴스 생성 (t2.micro, Ubuntu 24.04)
- [ ] Security Group: 22/80/443 포트 허용
- [ ] Elastic IP 할당 + 연결
- [ ] SSH 접속 확인

### 3단계 — 서버 초기 설정
- [ ] Java 21 설치
- [ ] PostgreSQL 16 설치
- [ ] DB + 유저 생성
- [ ] Nginx 설치
- [ ] Certbot 설치
- [ ] /opt/katsurank 디렉토리 생성

### 4단계 — 앱 실행 환경
- [ ] /etc/katsurank/env 환경변수 파일 생성
- [ ] /etc/systemd/system/katsurank.service 등록
- [ ] systemctl enable katsurank

### 5단계 — CI/CD
- [ ] GitHub Secrets 14개 등록
- [ ] 첫 수동 배포 + 헬스체크 확인
- [ ] deploy.yml push → Actions 자동 실행 확인

### 6단계 — HTTPS + 도메인
- [ ] DNS A 레코드 추가 (Elastic IP, DNS only 상태로)
- [ ] DNS 전파 확인 (dig api.katsurank.kr)
- [ ] API 문서(Swagger UI) Basic Auth 계정 생성 (htpasswd)
- [ ] Nginx 설정 파일 작성 (Swagger UI/OpenAPI 경로 포함)
- [ ] Certbot SSL 인증서 발급
- [ ] Cloudflare Proxy 활성화 (주황 구름)

### 7단계 — 카카오 연동
- [ ] 카카오 디벨로퍼스: 사이트 도메인 추가
- [ ] 카카오 디벨로퍼스: Redirect URI 추가
- [ ] 카카오 로그인 종단 간 테스트

### 완료 확인
- [ ] `curl https://api.katsurank.kr/actuator/health` → `{"status":"UP"}`
- [ ] `curl https://api.katsurank.kr/api/v1/ranking` → 정상 응답

---

## M3. 프론트엔드 개발 ⬜

> 백엔드 배포 완료 후 시작

- [ ] Next.js 프로젝트 세팅
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
