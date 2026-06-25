# Frontend STYLE — AI 작업 규칙

이 문서는 **AI가 프론트엔드 페이지·컴포넌트를 만들 때 반드시 따를 스타일 규칙**입니다.  
사람이 읽어도 되지만, **코드 생성 전에 이 파일을 먼저 적용**하세요.

**마크업·컴포넌트 분리·레이아웃**은 **`COMPONENTS.md`와 함께** 읽을 것.  
**타입·API·React Query·constants**는 **`DATA.md`** 참고.

스택: **React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router**

---

## 1. 스타일 우선순위 (필수)

아래 순서를 지킵니다. **위에서 해결되면 아래 방법은 쓰지 않습니다.**

1. **Tailwind 유틸 클래스** (`className`) — **기본·최우선**
2. **페이지 전용 CSS** — 같은 페이지에서 **3번 이상 반복**되거나 `clamp()` / 복잡한 선택자가 필요할 때만
3. **shared 전역 CSS** — **2개 이상 페이지/컴포넌트**에서 쓰이는 토큰·공통 패턴

### AI에게 금지

- 새 페이지마다 `.css` 파일부터 만들지 않기
- Tailwind로 한 줄로 쓸 수 있는 걸 CSS로 빼지 않기
- `style={{ ... }}` 인라인 스타일 남발하지 않기 (Tailwind로 불가능한 경우만 예외)
- `PageShell` + placeholder를 **최종 UI로 두지 않기** (임시용만)

---

## 2. 폴더 구조

```
frontend/src/
├── app/              # App, routes, providers (라우팅 껍데기만)
├── pages/            # URL 단위 페이지 ← 새 화면은 여기
│   └── home/
│       ├── HomePage.tsx
│       ├── components/
│       ├── constants/
│       └── style/      # 이 페이지에서만 반복되는 CSS
│           └── home.css
├── shared/
│   ├── ui/           # Button, BottomNav 등 공용 UI
│   ├── styles/       # globals.css, pages.css 등 전역
│   ├── api/
│   ├── hooks/
│   ├── constant/
│   └── type/
└── assets/           # import 하는 이미지
public/images/        # URL 경로로 쓰는 정적 이미지 (/images/...)
```

> `app/pages` 같은 경로는 **없음**. 페이지는 **`src/pages/<page-name>/`** 아래에 만든다.

---

## 3. Tailwind 사용 규칙

### 기본

- **모든 JSX 마크업에 Tailwind `className`으로 스타일 작성**
- 반응형·모바일 분기는 **`useIsMobile()` 훅**으로 컴포넌트 분리 (예: `HomeHeaderDesktop` / `HomeHeaderMobile`).  
  같은 컴포넌트 안에 `md:`/`hidden` 남발하지 않기 (프로젝트 컨벤션).
- 색은 **브랜드 토큰 우선** (`globals.css`의 CSS 변수 또는 아래 HEX)

### 브랜드 색 (자주 쓰는 값)

| 용도         | HEX / 변수                               |
| ------------ | ---------------------------------------- |
| 페이지 배경  | `#FFFDF4`                                |
| 보조 텍스트  | `#5F4A3C`, `#8A7A6A`                     |
| 보더         | `#E8D9BF`, `#E6D5B8`                     |
| Primary 버튼 | `--color-primary-button-*` (globals.css) |
| 강조/호버    | `#D88A24`                                |

상세 팔레트: `docs/04_brand_design_guide.md`

### Tailwind 예시 (선호)

```tsx
<section className="relative px-5 pb-4 pt-14 bg-[#FFFDF4] text-[#2A1A12]">
  <h1 className="text-[clamp(1.625rem,7vw,2.625rem)] font-black leading-tight">
    서울 돈까스 랭킹
  </h1>
</section>
```

- 간단한 `clamp()`는 Tailwind arbitrary value로 OK
- **같은 clamp/블록이 여러 곳**이면 → 페이지 CSS 또는 shared로 승격

---

## 4. CSS 파일을 만들 때 (예외)

### 4-1. 페이지 전용 — `pages/<name>/style/<name>.css`

**조건 (하나 이상 해당할 때만):**

- 같은 클래스 패턴이 **해당 페이지 내 3곳 이상** 반복
- `@keyframes`, 복잡한 pseudo, BEM 블록이 **10줄 이상**
- viewport 기반 유동 레이아웃 (`clamp` + flex 조합)을 **한 페이지에서만** 쓰고 TSX가 지저분해질 때

**사용법:**

```tsx
// pages/home/HomePage.tsx
import "./style/home.css";
```

```css
/* pages/home/style/home.css — 페이지 전용 클래스만 */
.mobile-hero { ... }
.mobile-hero__title { ... }
.katsu-map-pin { ... }
```

**네이밍:** `{page}-{block}` 또는 BEM (`mobile-hero__title`).  
**페이지 CSS에는 다른 페이지 전용 스타일 넣지 않기.**

### 4-2. 전역 — `shared/styles/`

| 파일          | 용도                                                           |
| ------------- | -------------------------------------------------------------- |
| `globals.css` | Tailwind import, `:root` CSS 변수, reset, body                 |
| `pages.css`   | (레거시) 공용 `.page` 레이아웃 — 새 코드는 가능하면 Tailwind로 |

**조건:** 2개 이상 페이지/공용 컴포넌트에서 동일 패턴일 때만 `globals.css`에 변수·유틸 추가.

```css
/* globals.css — 토큰 추가 예 */
:root {
  --color-surface: #fffdf4;
}
```

---

## 5. 새 페이지 만들 때 AI 체크리스트

1. `src/pages/<kebab-case>/` 폴더 생성
2. `<PageName>Page.tsx` — **Tailwind로 UI 작성**
3. 전용 컴포넌트는 `pages/<name>/components/`
4. 상수·목 데이터는 `pages/<name>/constants/` 또는 `shared/`
5. `app/routes.tsx`에 Route 등록
6. **모바일**이면 `AppLayout`의 `BottomNav`와 헤더 높이 고려 (padding-top / 하단 spacer)
7. CSS 파일은 **필요할 때만** `style/<name>.css` 추가

### 페이지 파일 예시

```tsx
// pages/restaurant-detail/RestaurantDetailPage.tsx
export function RestaurantDetailPage() {
  return (
    <main className="bg-[#FFFDF4] px-5 pb-6 pt-14 text-[#2A1A12]">
      <h1 className="text-xl font-bold">가게 상세</h1>
      {/* ... */}
    </main>
  );
}
```

---

## 6. 컴포넌트·import 규칙

프론트 폴더는 **`pages/` + `shared/` 두 축**만 쓴다. `features/` 같은 별도 최상위 폴더는 없다.

- **페이지 전용 UI** → `pages/<name>/components/`
- **2개 이상 페이지에서 쓰는 UI** → `shared/ui/` (투표 버튼, 검색 입력 등)
- **재사용 훅** → `shared/hooks/`
- **API fetch** → `shared/api/` (`DATA.md`)
- **React Query** → `shared/queries/`, `shared/mutations/`
- **타입** → `shared/types/` (공용) · `pages/<name>/types/` (페이지 전용)
- **상수** → `shared/constant/` · `pages/<name>/constants/` (값만, 목업 X)
- 경로: 페이지에서 shared는 `../../shared/...` (깊이에 맞게)

처음엔 `pages/`에 두고, **두 번째 페이지에서 import**할 때 `shared/`로 옮긴다.

---

## 7. 포맷·린트

- 저장 시 Prettier (`frontend/.prettierrc`)
- `pnpm format` / `pnpm lint` (frontend 폴더)
- `semi: false`, `singleQuote: true`, `printWidth: 100`

---

## 8. 빠른 판단표 (AI용)

| 상황                                  | 할 일                                   |
| ------------------------------------- | --------------------------------------- |
| 버튼 하나, 카드 하나                  | Tailwind only                           |
| 같은 페이지에서 5번 쓰는 리스트 row   | `pages/foo/style/foo.css` + className   |
| 홈 지도 핀, 모바일 hero 유동 레이아웃 | `pages/home/style/home.css` (기존 패턴) |
| 브랜드 색·폰트 변수                   | `shared/styles/globals.css`             |
| 두 페이지에서 쓰는 버튼               | `shared/ui/Button.tsx` + Tailwind       |
| 레이아웃 placeholder                  | `PageShell` (개발용, 최종 UI 아님)      |

---

## 9. 참고 파일

- **컴포넌트 분리·마크업**: `.claude/frontend/COMPONENTS.md`
- **타입·API·Query·constants**: `.claude/frontend/DATA.md`
- 브랜드: `docs/04_brand_design_guide.md`
- 레이아웃: `src/shared/ui/AppLayout.tsx` (`<Outlet />` = Next layout children)
- 홈 Tailwind + CSS 혼합 예: `src/pages/home/`
- 전역 토큰: `src/shared/styles/globals.css`
- 공용 버튼: `src/shared/ui/Button.tsx`
