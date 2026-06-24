# 랭킹 API 구현 스펙

> 공통 컨벤션은 `00_common.md` 참조 (rank 정책, 에러 패턴, 스키마 변경 원칙)

## 목표
서울 단일 랭킹 조회와 지도 핀용 가게 목록 API를 구현한다.

## 전제 (이미 존재하는 것)
- `Restaurant` 엔티티, `RestaurantRepository`, `RestaurantResponse` record 존재
- `RestaurantStatus` enum (ACTIVE / CLOSED / RELOCATED / PENDING / REJECTED)
- DB 인덱스 `idx_status_vote_count (status, vote_count DESC)` 존재
- DB 인덱스 `idx_lat_lng (latitude, longitude)` 존재
- `ranking` 패키지 이미 생성됨 (package-info.java만 있음)
- `ApiException` 기반 에러 처리 패턴 존재 (`00_common.md` 참조)

## 스키마 변경: 없음

---

## API 스펙

### GET `/api/v1/ranking`
서울 전체 단일 랭킹. 인증 불필요.

**Query Parameters**
| 파라미터 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `limit` | int | 20 | 최대 50 |
| `offset` | int | 0 | 페이지 오프셋 |

**Response 200**
```json
{
  "items": [
    {
      "rank": 1,
      "id": 1,
      "name": "명동돈가스",
      "address": "서울 중구 ...",
      "latitude": 37.5630,
      "longitude": 126.9869,
      "voteCount": 142,
      "placeUrl": "https://place.map.kakao.com/..."
    }
  ],
  "total": 87,
  "offset": 0,
  "limit": 20
}
```

**비즈니스 규칙**
- `status = 'ACTIVE'` 인 가게만 포함
- `vote_count DESC, id ASC` 정렬. 동점이면 id 오름차순 (등록 순)
- `rank` 는 offset 을 반영한 절대 순위 (`offset + index + 1`) — `00_common.md` 위치 기반 방식
- limit 최대값 50 초과 시 400 반환

---

### GET `/api/v1/ranking/top`
서울 1위(왕좌) 단건 조회. 인증 불필요.

**Response 200**
```json
{
  "rank": 1,
  "id": 1,
  "name": "명동돈가스",
  "address": "서울 중구 ...",
  "latitude": 37.5630,
  "longitude": 126.9869,
  "voteCount": 142,
  "placeUrl": "https://place.map.kakao.com/..."
}
```

**Response 204** — ACTIVE 가게가 하나도 없을 때 (초기 상태)

---

### GET `/api/v1/ranking/map-pins`
지도 핀 표시용 전체 가게 목록. 랭킹과 책임이 다름. 인증 불필요.

**Response 200**
```json
[
  {
    "id": 1,
    "name": "명동돈가스",
    "latitude": 37.5630,
    "longitude": 126.9869,
    "voteCount": 142
  }
]
```

**비즈니스 규칙**
- `status = 'ACTIVE'` 인 가게만
- 좌표(`latitude`, `longitude`) 없는 가게는 제외
- 응답 필드는 지도 핀에 필요한 것만 (이름·좌표·표수). rank 는 포함하지 않음 — 프론트가 필요하면 `/ranking` 을 사용
- 페이지네이션 없음 (서울 돈까스 가게 수는 많아도 수백 개 수준)

---

## 구현 가이드

### 파일 위치
- `com.katsurank.ranking.RankingController` — 랭킹 엔드포인트 (`/ranking`, `/ranking/top`)
- `com.katsurank.ranking.RankingService` — 쿼리 로직
- `com.katsurank.ranking.RankingItem` — 랭킹 응답 record
- `com.katsurank.ranking.RankingResponse` — 페이지네이션 래퍼 record (`total` 은 `long` 타입)
- `com.katsurank.ranking.MapPinResponse` — 지도 핀 응답 record
- `GET /api/v1/restaurants` 는 `RestaurantController` 에 추가

### Repository 쿼리

메서드명 파생 쿼리에 `OrderBy` 를 쓰면 `Pageable` 의 Sort 와 충돌할 수 있다.
**`@Query` JPQL 을 사용하거나, 메서드명에서 OrderBy 를 빼고 Pageable 에 Sort 를 명시적으로 넘겨라.**

```java
// 방법 1: @Query JPQL (권장)
@Query("SELECT r FROM Restaurant r WHERE r.status = :status ORDER BY r.voteCount DESC, r.id ASC")
Page<Restaurant> findRanking(@Param("status") RestaurantStatus status, Pageable pageable);

// 방법 2: 메서드명 파생 + Sort 를 Pageable 에 포함
Page<Restaurant> findByStatus(RestaurantStatus status, Pageable pageable);
// 호출: PageRequest.of(page, size, Sort.by(Order.desc("voteCount"), Order.asc("id")))
```

```java
// RestaurantRepository 에 추가 — 지도 핀용
List<Restaurant> findByStatusAndLatitudeIsNotNullAndLongitudeIsNotNull(RestaurantStatus status);
```

### 에러 처리
```java
// limit 초과 예외 — ApiException 상속
public class LimitExceededException extends ApiException {
    public LimitExceededException() {
        super(HttpStatus.BAD_REQUEST, "LIMIT_EXCEEDED", "limit은 50 이하여야 합니다.");
    }
}
```

### 금지 사항
- `bounds`(뷰포트) 파라미터로 지역 필터링 금지 — 랭킹은 서울 단일
- 엔티티를 응답으로 직접 반환 금지 — 반드시 record DTO 사용
- Flyway 마이그레이션 파일 생성 금지

## 완료 조건
- [ ] `GET /api/v1/ranking` 응답에 rank 필드 포함, limit/offset 동작
- [ ] `GET /api/v1/ranking/top` ACTIVE 가게 없을 때 204 반환
- [ ] `GET /api/v1/restaurants` 좌표 없는 가게 제외, rank 필드 없음
- [ ] `./gradlew test` 통과

## 테스트 케이스
- ACTIVE 가게 3개, vote_count = [10, 5, 5] → rank 순서 [1, 2, 3] (동점은 id 순, 위치 기반)
- CLOSED 가게는 랭킹에서 제외
- limit=50 초과 요청 → 400
- ACTIVE 가게 0개 → `/ranking/top` 204, `/ranking` items=[]
- offset=2, limit=1 → rank=3 (offset 반영)
