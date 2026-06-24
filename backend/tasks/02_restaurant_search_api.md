# 가게 검색 + 상세 순위 API 구현 스펙

> 공통 컨벤션은 `00_common.md` 참조 (rank 정책, 에러 패턴, 스키마 변경 원칙)

## 목표
자체 DB 가게 이름 검색과 가게 상세 조회에 서울 순위 정보를 추가한다.

## 전제 (이미 존재하는 것)
- `RestaurantController` 에 `POST /api/v1/restaurants`, `GET /api/v1/restaurants/{id}` 존재
- `RestaurantResponse` record 존재 (rank 필드 없음 — 이번에 추가)
- `RestaurantRepository` 존재
- 01 태스크의 랭킹 쿼리 구현 완료 전제 (rank 계산 로직 재사용)

## 스키마 변경: 없음

---

## API 스펙

### GET `/api/v1/restaurants/search`
자체 DB 가게 이름 검색. 인증 불필요.

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `q` | string | 필수 | 검색어 (최소 1자) |
| `limit` | int | 선택 | 기본 20, 최대 50 |

**Response 200**
```json
[
  {
    "id": 1,
    "name": "명동돈가스",
    "address": "서울 중구 ...",
    "voteCount": 142,
    "rank": 1,
    "placeUrl": "https://place.map.kakao.com/..."
  }
]
```

**Error**
- `400 MISSING_QUERY` — `q` 파라미터 없거나 빈 문자열

**비즈니스 규칙**
- `name ILIKE '%{q}%'` (PostgreSQL 대소문자 무시)
- `status = 'ACTIVE'` 인 가게만 검색 (CLOSED/RELOCATED 제외)
- ACTIVE 만 반환하므로 응답에 `status` 필드를 포함하지 않음
- `vote_count DESC` 정렬
- 검색어 앞뒤 공백 trim

---

### GET `/api/v1/restaurants/{id}` — rank 필드 추가
기존 엔드포인트에 현재 서울 순위를 추가한다.

**Response 200 (변경)**
```json
{
  "id": 1,
  "name": "명동돈가스",
  "address": "서울 중구 ...",
  "roadAddress": "서울 중구 ...",
  "latitude": 37.5630,
  "longitude": 126.9869,
  "kakaoCategory": "음식점 > 일식 > 돈까스,우동",
  "phone": "02-123-4567",
  "placeUrl": "https://place.map.kakao.com/...",
  "status": "ACTIVE",
  "voteCount": 142,
  "rank": 1,
  "createdAt": "2026-06-01T00:00:00Z"
}
```

**비즈니스 규칙**
- CLOSED/RELOCATED 가게도 조회는 허용 (투표 불가지만 마이페이지·히스토리에서 링크됨)
- ACTIVE 아닌 가게의 `rank` 는 `null`

---

## 구현 가이드

### rank 계산 방식 — 집계 기반 (단건 조회용)

`00_common.md` 의 "단건 조회 — 집계 기반" 방식을 따른다.
목록 기반 rank(01 태스크) 와 동점 시 1~2 차이날 수 있으나 MVP 에서 허용.

```java
// 단건 rank 계산: vote_count 보다 큰 ACTIVE 가게 수 + 1
long rank = restaurantRepository.countByStatusAndVoteCountGreaterThan(
    RestaurantStatus.ACTIVE, restaurant.getVoteCount()) + 1;
```

### 검색 쿼리
```java
// RestaurantRepository
List<Restaurant> findByStatusAndNameContainingIgnoreCaseOrderByVoteCountDesc(
    RestaurantStatus status, String name, Pageable pageable);
```

### RestaurantResponse 변경
`rank` 필드 추가. nullable (`Long`). 기존 `from(Restaurant)` 메서드에 rank 파라미터 추가.

### 파일 변경
- `RestaurantResponse` — `rank` 필드 추가 (nullable Long)
- `RestaurantRepository` — 검색 쿼리, COUNT 쿼리 추가
- `RestaurantService` — `search()`, `getById()` rank 계산 포함
- `RestaurantController` — `GET /restaurants/search` 추가

### 금지 사항
- 카카오 로컬 API를 검색에 사용 금지 — 자체 DB 검색만
- `GET /api/v1/kakao-places/search` 는 가게 등록 전 후보 탐색 전용
- Flyway 마이그레이션 파일 생성 금지

## 완료 조건
- [ ] `GET /api/v1/restaurants/search?q=돈가스` — ACTIVE 가게만, vote_count 순
- [ ] 검색 응답에 `status` 필드 없음
- [ ] `q` 없으면 400
- [ ] `GET /api/v1/restaurants/{id}` 응답에 `rank` 포함
- [ ] CLOSED 가게 상세 조회 시 `rank=null`
- [ ] `./gradlew test` 통과

## 테스트 케이스
- `q=돈가스` → "명동돈가스", "을지돈가스" 모두 히트
- `q=  ` (공백만) → 400
- CLOSED 가게 id 조회 → 200, rank=null
- vote_count=10인 가게의 rank = (vote_count 10 초과인 ACTIVE 가게 수) + 1
- 동점(vote_count 같은 ACTIVE 가게 2개) → 두 가게 모두 같은 rank (집계 기반)
