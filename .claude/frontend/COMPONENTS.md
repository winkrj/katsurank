# Frontend COMPONENTS — AI 마크업·분리 규칙

사용자가 **「마크업 해줘」「UI 만들어줘」「화면 짜줘」** 라고 하면, AI는 **이 파일 + `STYLE.md`를 함께** 적용한다.

- 스타일(Tailwind, CSS 위치): **`STYLE.md`**
- 컴포넌트 분리·파일 생성·레이아웃: **이 파일**
- 타입·API·React Query·constants: **`DATA.md`**

---

## 0. AI 작업 순서 (명령어)

마크업 요청을 받으면 **아래 순서로** 진행한다.

1. **읽기** — `docs/` 기획·`docs/04_brand_design_guide.md`·기존 유사 페이지(`pages/home/` 등)
2. **레이아웃 확인** — 헤더/탭바는 `AppLayout`에 이미 있음 → **페이지에 Header/BottomNav 중복 금지**
3. **페이지 파일** — `pages/<name>/<Name>Page.tsx`는 **조립만** (20~40줄 이내 목표)
4. **섹션 분리** — 화면을 의미 단위로 `components/`에 파일 생성
5. **공용 승격** — 2개 이상 페이지에서 쓰이면 `shared/ui/` · `shared/hooks/` 등으로 이동
6. **Route 등록** — `app/routes.tsx`에 path 추가
7. **스타일** — Tailwind 우선 (`STYLE.md` 준수)

### 사용자 요청별 AI 행동

| 사용자 요청               | AI가 할 일                                                        |
| ------------------------- | ----------------------------------------------------------------- |
| 「○○ 페이지 마크업해줘」  | `pages/○○/` 폴더 + `○○Page.tsx` + `components/*` 생성, Route 등록 |
| 「이 Figma/스크린샷대로」 | 섹션 단위 컴포넌트로 쪼개고 Tailwind 적용                         |
| 「컴포넌트만 추가」       | 해당 `pages/.../components/` 또는 `shared/ui/`에만 추가           |
| 「리팩만」                | 동작 변경 없이 파일 분리·이름 정리                                |

---

## 1. 레이아웃 (Next.js layout과 동일 개념)

```
AppLayout (shared/ui/AppLayout.tsx)
├── HomeHeader          ← 공통 (모바일/데스크탑)
├── <Outlet />          ← 페이지마다 바뀌는 영역 (= children)
└── BottomNav           ← 모바일 공통
```

**페이지(`*Page.tsx`)는 `<Outlet />` 안에 들어가는 본문만** 작성한다.

```tsx
// ✅ Good — HomePage.tsx
export function HomePage() {
  const isMobile = useIsMobile();
  return (
    <main className="overflow-x-hidden bg-[#FFFDF4] text-[#2A1A12]">
      {isMobile ? <MobileHero /> : <DesktopMain />}
    </main>
  );
}

// ❌ Bad — 레이아웃 중복
export function SomePage() {
  return (
    <>
      <HomeHeader />
      <main>...</main>
      <BottomNav />
    </>
  );
}
```

레이아웃 없는 페이지(OAuth 콜백 등)만 `AppLayout` 밖 Route에 둔다.

---

## 2. 폴더·파일 역할

```
pages/<page-name>/
├── <PageName>Page.tsx     # 진입점 — 조립·분기만
├── components/            # 이 페이지 전용 UI
│   ├── desktop/           # 데스크탑 전용 UI
│   ├── mobile/            # 모바일 전용 UI
│   └── …                  # 양쪽 공용 (RankBadge, XxxList 등)
├── types/                 # 이 페이지 전용 타입
├── constants/             # 상수 값만 (목업·타입 X) → DATA.md
├── mocks/                 # 목업 데이터 (개발용)
├── queries/               # 페이지 전용 useQuery (선택)
└── style/                 # 반복 CSS만 (STYLE.md 조건)
    └── <page-name>.css
```

| 위치                    | 넣을 것                           | 예                                  |
| ----------------------- | --------------------------------- | ----------------------------------- |
| `pages/.../components/` | **이 URL에서만** 쓰는 UI          | `RankingList`, `ShopInfoCard`       |
| `pages/.../types/`      | **이 페이지 전용** 타입           | `RestaurantDetail`                  |
| `pages/.../mocks/`      | 목업·fixture                      | `restaurantDetail.mock.ts`          |
| `pages/.../constants/`  | **상수 값**만                     | `RESTAURANT_IMAGE_TOTAL_COUNT`      |
| `shared/ui/`            | **2+ 페이지** 또는 **앱 전역** UI | `Button`, `AppLayout`               |
| `shared/ui/header/`     | **앱 전역 헤더**                  | `HomeHeader`, `KakaoLoginButton`    |
| `shared/hooks/`         | 재사용 훅                         | `useIsMobile`                       |
| `shared/api/`           | HTTP fetch (Query 없음)           | `fetchRestaurants`                  |
| `shared/queries/`       | 공용 `useQuery`                   | `useRestaurantsQuery`               |
| `shared/mutations/`     | 공용 `useMutation`                | `useCreateVoteMutation`             |
| `shared/types/`         | 공용 타입                         | `RankingItem`, `Restaurant`         |

> **`features/` 폴더는 쓰지 않는다.** 공용은 전부 `shared/` 아래로.

### 2-1. `desktop/` · `mobile/` 폴더 (모바일/데스크탑 UI 분리)

모바일과 데스크탑 **레이아웃이 다른 페이지**는 `components/` 안에 **`desktop/`**, **`mobile/`** 폴더를 만들어 나눈다.

```
pages/search/
├── SearchPage.tsx
└── components/
    ├── desktop/
    │   └── DesktopSearchPage.tsx   # 또는 SearchSidebar.tsx 등
    ├── mobile/
    │   └── MobileSearchPage.tsx
    ├── SearchForm.tsx              # layout prop 등으로 양쪽 공용
    ├── SearchResultCard.tsx
    └── SearchResultList.tsx
```

| 위치 | 넣을 것 |
| ---- | ------- |
| `components/desktop/` | **데스크탑에서만** 렌더되는 UI |
| `components/mobile/` | **모바일에서만** 렌더되는 UI |
| `components/` (루트) | **양쪽에서 공유**하는 UI (카드, 리스트, 폼, 뱃지 등) |

**`*Page.tsx`는 여전히 `useIsMobile()`로 분기만** 하고, 실제 마크업은 하위 폴더 컴포넌트에 둔다.

```tsx
// ✅ Good — SearchPage.tsx
import { useIsMobile } from '../../shared/hooks/useIsMobile'
import { DesktopSearchPage } from './components/desktop/DesktopSearchPage'
import { MobileSearchPage } from './components/mobile/MobileSearchPage'

export function SearchPage() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileSearchPage /> : <DesktopSearchPage />
}

// ❌ Bad — desktop/mobile 파일을 components/ 루트에 섞어 두기
// components/DesktopSearchPage.tsx
// components/MobileSearchPage.tsx
// components/SearchSidebar.tsx
```

**네이밍**

- 진입용 shell: `DesktopXxxPage.tsx` / `MobileXxxPage.tsx` (해당 폴더 안)
- 섹션 단위: `DesktopShopHero.tsx` / `MobileShopHero.tsx` 또는 역할 이름만 (`ShopVotePanel.tsx` — 폴더로 구분)

**예외 — 폴더 없이 루트에 둬도 됨**

- 모바일/데스크탑 **차이가 거의 없는** 작은 컴포넌트 (`layout` prop 하나로 처리)
- **한쪽만** 있는 UI가 1~2개뿐인 아주 작은 페이지 (그래도 shell은 `mobile/` · `desktop/` 권장)

**기존 코드**

- `MobileXxx.tsx` / `DesktopXxx.tsx`가 `components/` 루트에 있으면 **새 작업·리팩 시** `mobile/` · `desktop/`으로 옮긴다.
- `shared/ui/header/`처럼 **앱 전역** 레이아웃은 `shared/` 규칙을 따른다 (페이지 `components/` 아님).

---

## 3. 컴포넌트 나누는 기준

### 3-1. 반드시 파일로 분리

- **화면 섹션** 1개 = 컴포넌트 1개 (Hero, RankingList, ShopDetailHeader …)
- **리스트 + 아이템** → `XxxList.tsx` + `XxxListItem.tsx` (또는 `RankBadge`처럼 작은 단위)
- **모바일 / 데스크탑 레이아웃이 다름** → `components/mobile/` · `components/desktop/` (+ `useIsMobile`, §2-1)
- **한 파일 150줄 넘어가려 할 때** → 섹션 단위로 쪼개기

### 3-2. 한 파일에 둬도 됨

- 10줄 미만 순수 표시 UI
- 부모에서만 1번 쓰는 아주 작은 wrapper

### 3-3. `pages/` vs `shared/` (승격 기준)

| 조건                                          | 위치                               |
| --------------------------------------------- | ---------------------------------- |
| **이 페이지만**                               | `pages/foo/components/`            |
| **2개 이상 페이지** (투표, 검색, 로그인 버튼) | `shared/ui/`                       |
| **2개 이상 페이지** (데이터·상태 로직)        | `shared/hooks/` 또는 `shared/api/` |

처음엔 `pages/`에 두고, **두 번째 페이지에서 import**할 때 `shared/`로 옮긴다.

---

## 4. 네이밍 규칙

| 종류            | 규칙                       | 예                          |
| --------------- | -------------------------- | --------------------------- |
| 페이지          | `PascalCase` + `Page`      | `RestaurantDetailPage.tsx`  |
| 폴더            | `kebab-case`               | `restaurant-detail/`        |
| 섹션 컴포넌트   | 역할 이름 (Page 접미사 X)  | `ShopHero`, `VoteSection`   |
| 리스트          | `XxxList`                  | `RankingList`               |
| 모바일/데스크탑 shell | `mobile/` · `desktop/` 폴더 + `MobileXxx` / `DesktopXxx` | `mobile/MobileSearchPage`, `desktop/DesktopMain` |
| props 타입      | `ComponentNameProps`       | `ShopHeroProps`             |

export는 **named export** (`export function Foo`).

---

## 5. `*Page.tsx` 작성 템플릿

```tsx
// pages/restaurant-detail/RestaurantDetailPage.tsx
import { useParams } from "react-router-dom";
import { ShopDetailHero } from "./components/ShopDetailHero";
import { ShopVoteSection } from "./components/ShopVoteSection";

export function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <main className="bg-[#FFFDF4] px-5 pb-6 pt-4 text-[#2A1A12]">
      <ShopDetailHero shopId={id} />
      <ShopVoteSection shopId={id} />
    </main>
  );
}
```

- **데이터 fetching**은 페이지 또는 `components/`의 custom hook (`useShopDetail.ts`)
- **마크업 덩어리**는 자식 컴포넌트로

---

## 6. 마크업 분리 예시 (가게 상세)

```
pages/restaurant-detail/
├── RestaurantDetailPage.tsx      # useIsMobile 분기
├── components/
│   ├── desktop/
│   │   └── DesktopRestaurantDetail.tsx
│   ├── mobile/
│   │   └── MobileRestaurantDetail.tsx
│   ├── ShopVoteStatsCard.tsx     # 양쪽 공용
│   └── RestaurantVoteConfirmButton.tsx
├── hooks/
│   └── useRestaurantDetail.ts    # (API 연동 시)
└── constants/
    └── index.ts                  # mock 있을 때만
```

투표 버튼이 다른 페이지와 같으면:

```
shared/ui/VoteButton.tsx  ← 2+ 페이지 공용 UI
pages/restaurant-detail/components/ShopVoteSection.tsx  ← 이 페이지 배치·레이아웃만
```

---

## 7. 참고 — 홈 페이지 (잘 된 예)

```
pages/home/
├── HomePage.tsx              # isMobile 분기만 (~15줄)
├── components/
│   ├── mobile/
│   │   └── MobileHero.tsx
│   ├── desktop/
│   │   └── DesktopMain.tsx
│   ├── HeroHeading.tsx       # layout prop으로 공용
│   ├── RankingList.tsx
│   ├── RankBadge.tsx
│   ├── VoteButtons.tsx
│   └── MapPin.tsx
├── constants/index.ts
└── style/home.css            # 지도 핀, mobile-hero 유동 레이아웃만
```

헤더는 **`shared/ui/header/`** + **`AppLayout`** 에 있음 (home 전용 아님).

---

## 8. AI 금지 사항

- `*Page.tsx` 한 파일에 **200줄+ 마크업** 몰아넣기
- `view/` / `components/` / `styles/` **역할별 최상위 폴더**로 쪼개기 (STYLE.md와 동일)
- `PageShell` + DEV 링크를 **최종 UI**로 제출
- 헤더·BottomNav를 **페이지마다** 다시 넣기
- mock 데이터를 컴포넌트 파일 **안에** 하드코딩 (→ `constants/` 또는 `shared/`)
- 분리 안 하고 「나중에 리팩」만 남기기

---

## 9. 마크업 완료 후 AI 체크리스트

- [ ] `AppLayout` / `<Outlet />` 구조 준수
- [ ] `*Page.tsx`는 조립만, 섹션은 `components/`
- [ ] 모바일/데스크탑 UI가 다르면 `components/mobile/` · `components/desktop/`로 분리
- [ ] Tailwind 우선 (`STYLE.md`)
- [ ] `app/routes.tsx` Route 등록
- [ ] 모바일: `pt-14`(헤더 56px) **반드시** 추가 — `HomeHeader`는 `fixed`라 문서 흐름에 없음. 없으면 헤더에 콘텐츠가 가려짐
- [ ] 모바일: `pb-[calc(68px+env(safe-area-inset-bottom,0px))]` 또는 `pb-[68px]`로 탭바 여백 확보
- [ ] 전체화면 컴포넌트(지도 등): `marginTop: 56px` + `height: calc(100vh - 56px - 68px)` 조합 사용 (`pt-14` 대신)
- [ ] `pnpm run build` 통과
- [ ] Prettier 포맷

---

## 10. 관련 문서

- **스타일**: `.claude/frontend/STYLE.md`
- **타입·API·Query**: `.claude/frontend/DATA.md`
- **브랜드**: `docs/04_brand_design_guide.md`
- **기획/URL**: `docs/03_data_model_and_tech.md`
- **레이아웃 코드**: `src/shared/ui/AppLayout.tsx`
- **홈 참고 구현**: `src/pages/home/`
