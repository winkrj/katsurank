# Frontend DATA — 타입·API·상수 규칙

AI가 **타입, API, React Query, constants, 목업**을 작성할 때 이 파일을 따른다.  
스타일·컴포넌트 분리는 `STYLE.md`, `COMPONENTS.md`와 함께 읽을 것.

---

## 1. 폴더 구조 (데이터 계층)

```
shared/
├── api/                 # HTTP fetch 함수만 (React Query 없음)
│   ├── client.ts
│   ├── restaurants.ts
│   └── votes.ts
├── queries/             # useQuery 훅 (2+ 페이지 공용)
│   ├── queryKeys.ts
│   └── restaurants.ts
├── mutations/           # useMutation 훅 (2+ 페이지 공용)
│   └── votes.ts
├── types/               # 여러 페이지·API에서 쓰는 공용 타입
│   ├── ranking.ts
│   ├── restaurant.ts
│   └── vote.ts
└── constant/            # 앱 전역 상수 (URL, env 키 등)

pages/<page-name>/
├── types/               # 이 페이지(또는 이 도메인 UI) 전용 타입
├── constants/           # 이 페이지의 **상수 값**만
├── mocks/               # 목업·fixture 데이터 (개발용)
├── queries/             # 이 페이지 전용 useQuery (API 미연동·특수 케이스)
└── components/
```

> **`features/` 폴더 없음.** 공용은 `shared/`, 페이지 한정은 `pages/<name>/`.

---

## 2. 타입 (`types/`)

### 2-1. 어디에 넣나

| 조건 | 위치 | 예 |
|------|------|-----|
| **2개 이상** 페이지·`shared/api`에서 씀 | `shared/types/` | `RankingItem`, `Restaurant`, `VoteRequest` |
| **이 페이지 UI·목업**에서만 씀 | `pages/<page>/types/` | `RestaurantDetail`, `MenuItem` |

### 2-2. 규칙

- 파일명: `camelCase.ts` 또는 도메인명 (`restaurantDetail.ts`)
- `export type` — interface도 가능하지만 프로젝트는 type 위주
- **API 응답 타입**이 공용이면 `shared/types/`에 두고 `shared/api/`에서 import
- `constants/` · `mocks/` · 컴포넌트 파일 안에 **type 정의 금지** (페이지 전용은 `types/`로)

### 2-3. 예시

```ts
// shared/types/restaurant.ts
export type Restaurant = { id: number; name: string; ... }

// pages/restaurant-detail/types/restaurantDetail.ts
export type RestaurantDetail = { ... }  // 상세 화면 전용 필드
```

---

## 3. API (`shared/api/`)

### 3-1. 역할

- **순수 HTTP 호출**만. `fetch` / `apiClient`로 JSON 반환
- **React Query 훅은 여기 넣지 않음**

```ts
// shared/api/restaurants.ts
import { apiClient } from './client'
import type { Restaurant } from '../types/restaurant'

export function fetchRestaurant(id: number) {
  return apiClient<Restaurant>(`/api/restaurants/${id}`)
}
```

### 3-2. 타입 위치

- 요청·응답 타입은 `shared/types/` (공용) 또는 `pages/.../types/` (전용)
- `api/*.ts` 안에 `export type` **하지 않기**

---

## 4. React Query

### 4-1. 폴더 분리

| 종류 | 위치 | 내용 |
|------|------|------|
| **queryKey** | `shared/queries/queryKeys.ts` | 도메인별 키 팩토리 |
| **useQuery** | `shared/queries/<domain>.ts` | 목록·상세·검색 등 **조회** |
| **useMutation** | `shared/mutations/<domain>.ts` | 생성·수정·삭제·투표 등 |

페이지에서만 쓰는 query 훅 → `pages/<page>/queries/` (API 연동 전 목업 등).

### 4-2. queryKeys (필수)

```ts
// shared/queries/queryKeys.ts
export const queryKeys = {
  restaurants: {
    all: ['restaurants'] as const,
    detail: (id: string | number) => ['restaurants', 'detail', id] as const,
  },
} as const
```

- 문자열 하드코딩으로 `queryKey` 쓰지 않기
- `invalidateQueries`도 `queryKeys`로

### 4-3. useQuery 예시

```ts
// shared/queries/restaurants.ts
export function useRestaurantsQuery(params?: RestaurantListParams) {
  return useQuery({
    queryKey: queryKeys.restaurants.list(params),
    queryFn: () => fetchRestaurants(params),
  })
}
```

### 4-4. useMutation 예시

```ts
// shared/mutations/votes.ts
export function useCreateVoteMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createVote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.restaurants.all })
    },
  })
}
```

### 4-5. 페이지에서 사용

```tsx
// RestaurantDetailPage.tsx
const { data, isPending, isError } = useRestaurantDetailQuery(id)
```

컴포넌트 안에서 `useQuery` 직접 호출 **지양** → query 훅으로 분리.

### 4-6. 목업 기간

- `queryFn`에서 목업 반환 가능 (`pages/.../mocks/`)
- API 준비되면 `queryFn`만 `shared/api` 호출로 교체
- 목업 데이터는 **`mocks/`**, 타입은 **`types/`**

---

## 5. `constants/` — 상수만

### ✅ 넣을 것

- 변경되지 않는 **값**: `RESTAURANT_IMAGE_TOTAL_COUNT = 10`
- 페이지 UI 설정: `TAB_IDS`, `MAX_MENU_ITEMS`
- 라우트·쿼리 기본값 (페이지 한정)

### ❌ 넣지 말 것

- **타입 정의** → `types/`
- **목업 데이터 배열** → `mocks/`
- **API 호출 함수** → `shared/api/`
- **useQuery / useMutation** → `queries/` · `mutations/`
- 컴포넌트용 큰 객체 목록 (랭킹 mock 등) → `mocks/` 또는 `pages/home/constants`는 **목업이면 `mocks/`로 이전 권장**

```ts
// ✅ pages/restaurant-detail/constants/index.ts
export const RESTAURANT_IMAGE_TOTAL_COUNT = 10

// ❌ constants에 목업 + 타입
export type RestaurantDetail = { ... }
export const MOCK_RESTAURANT = { ... }
```

---

## 6. `mocks/` — 개발용 fixture

- API 미연동 시 UI·query 훅에서 사용
- `getMockRestaurantDetail(id)` 같은 **헬퍼**도 여기
- 프로덕션 빌드에 실수로 남기지 않도록, 연동 후 제거·교체 계획 명시

```ts
// pages/restaurant-detail/mocks/restaurantDetail.mock.ts
import type { RestaurantDetail } from '../types/restaurantDetail'
```

---

## 7. AI 작업 순서 (데이터 관련)

1. 타입 → `shared/types` vs `pages/.../types` 판단
2. `shared/api` fetch 함수 (백엔드 스펙 맞춤)
3. `queryKeys` 추가
4. `shared/queries` 또는 `shared/mutations` 훅
5. 목업 필요 시 `mocks/` + 페이지 `queries/`에서 임시 `queryFn`
6. 페이지는 **훅만** 호출, 컴포넌트는 `data` props로 받기
7. 상수만 `constants/`

---

## 8. 빠른 판단표

| 상황 | 위치 |
|------|------|
| 랭킹 아이템 타입 (홈·랭킹 공용) | `shared/types/ranking.ts` |
| 가게 상세 화면 전용 타입 | `pages/restaurant-detail/types/` |
| GET /api/restaurants | `shared/api/restaurants.ts` |
| useRestaurantsQuery | `shared/queries/restaurants.ts` |
| POST /api/votes | `shared/api/votes.ts` + `shared/mutations/votes.ts` |
| 상세 목업 (API 전) | `pages/restaurant-detail/mocks/` |
| 이미지 슬라이드 총 장수 10 | `pages/restaurant-detail/constants/` |
| queryKey 문자열 | `shared/queries/queryKeys.ts` |

---

## 9. 관련 문서·참고 코드

- 스타일: `.claude/frontend/STYLE.md`
- 컴포넌트: `.claude/frontend/COMPONENTS.md`
- QueryClient: `src/app/App.tsx`
- queryKeys: `src/shared/queries/queryKeys.ts`
- 가게 상세 예시: `src/pages/restaurant-detail/`
