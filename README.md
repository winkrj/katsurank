# 카츠랭 (katsurank)

> 당신의 인생 돈까스 한 집.

서울의 돈까스집을 두고, 카카오 로그인 사용자가 평생 단 한 표를 던지는 1인 1표 랭킹 사이트입니다. **표 = 누군가의 1순위라는 진심.**

## 한눈에

| | |
|---|---|
| 서비스명 | 카츠랭 (katsurank) |
| 도메인 (예정) | katsurank.kr |
| 한 줄 컨셉 | 1인 1표, 표 이동 가능, 지도 기반 실시간 랭킹 |
| 인증 | 카카오 OAuth |
| 일정 | 4주 MVP, 하루 1~2시간 |
| 상태 | 🚧 개발 시작 전 |

## 기술 스택

| 영역 | 스택 |
|---|---|
| 백엔드 | Spring Boot 3.x · Java 21 · JPA · PostgreSQL |
| 프론트 | Next.js (App Router) · TypeScript · Tailwind CSS |
| 지도 | 카카오맵 JS SDK · 카카오 로컬 검색 API |
| 인증 | 카카오 OAuth2 (세션 쿠키) |
| 호스팅 | Railway (백엔드) · Vercel (프론트) |

> 프론트 세부 스택(상태관리·폼 등)은 협업자와 미팅 후 확정.

## 레포 구조

```
katsurank/
├── docs/                  # 기획·디자인·기술 문서 (SSOT)
│   ├── 00_index.md
│   ├── 01_product_spec.md
│   ├── 02_mvp_scope.md
│   ├── 03_data_model_and_tech.md
│   ├── 04_brand_design_guide.md
│   ├── 05_week1_setup_guide.md
│   └── setup/             # 로컬 셋업 파일
├── backend/               # Spring Boot
├── frontend/              # Next.js (예정)
├── .github/workflows/     # GitHub Actions
├── README.md
└── CONTRIBUTING.md        # 협업 규칙
```

## 시작하기

### 백엔드

```bash
cd backend
docker compose up -d              # PostgreSQL 실행
./gradlew bootRun
```

상세 셋업: [`docs/05_week1_setup_guide.md`](docs/05_week1_setup_guide.md)

### 프론트 (예정)

```bash
cd frontend
pnpm install
pnpm dev
```

## 협업

- 협업 규칙·브랜치 전략·PR 룰: [`CONTRIBUTING.md`](.claude/CONTRIBUTING.md)
- 모든 기획·기술 결정은 `docs/` 에 마크다운으로 기록
- 결정이 바뀌면 문서 버전 올리고 변경 이력 갱신

## 라이선스

미정 (출시 전 결정)
