# Katsurank Frontend

React 19 + TypeScript + Vite. 패키지 매니저는 **pnpm**만 사용합니다.

## 요구 사항

- Node.js 22+ (pnpm 11 사용 시) 또는 팀에서 정한 LTS
- [pnpm](https://pnpm.io/installation)

## 처음 클론한 뒤

```bash
cd frontend
pnpm install
pnpm dev
```

개발 서버: http://localhost:5173

## 자주 쓰는 명령

| 명령           | 설명               |
| -------------- | ------------------ |
| `pnpm dev`     | 개발 서버          |
| `pnpm build`   | 프로덕션 빌드      |
| `pnpm preview` | 빌드 결과 미리보기 |
| `pnpm lint`    | ESLint             |

## 프로젝트를 처음부터 다시 만들 때 (참고)

`frontend` 폴더가 없거나 초기화할 때만:

```bash
cd ..   # katsurank 루트
rm -rf frontend
pnpm create vite@latest frontend
# Framework: React → Variant: TypeScript
cd frontend
pnpm install
```

## `src` 폴더 구조

```
src/
├── app/                 # App, 라우터
│   ├── App.tsx
│   └── routes.tsx
├── pages/               # URL 단위 화면
│   ├── home/
│   ├── restaurant-detail/
│   ├── restaurant-new/
│   ├── my-page/
│   ├── legal/
│   └── oauth/
├── shared/              # pages 밖 공용
│   ├── api/             # HTTP fetch
│   ├── queries/         # useQuery
│   ├── mutations/       # useMutation
│   ├── types/           # 공용 타입
│   ├── ui/
│   ├── hooks/
│   └── styles/
├── assets/
└── main.tsx
```

환경 변수: `frontend/.env.example` → `.env` 복사 후 `VITE_API_BASE_URL` 설정.
