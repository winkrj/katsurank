# 가게 상태 관리 API 구현 스펙 (폐업 / 이전)

> 공통 컨벤션은 `00_common.md` 참조 (rank 정책, 에러 패턴, 스키마 변경 원칙)

## 목표
운영자가 폐업·이전한 가게를 처리하는 API를 구현한다.
MVP에서는 운영자(본인) 수동 처리. 자동 감지는 V2 이후.

## 전제 (이미 존재하는 것)
- `Restaurant` 엔티티에 `status`, `closedAt`, `relocatedToId` 필드 존재
- `Restaurant.close()` 도메인 메서드 존재 (status=CLOSED, closedAt=now)
- `Restaurant.increaseVoteCount()` (+1), `decreaseVoteCount()` (-1) 존재
- `RestaurantStatus` enum (ACTIVE / CLOSED / RELOCATED / PENDING / REJECTED)
- `VoteRepository`, `UserRepository` 존재
- 투표(`Vote`) 는 hard delete 금지, `is_current` 로만 관리
- `Restaurant` 에 `@Version` 낙관적 락 존재

## 권한 정책

**MVP에서는 로그인한 사용자라면 누구나 호출 가능** (운영자=본인 1명 전제).
별도 ADMIN 롤 구현 금지 — 오버엔지니어링. 추후 사용자 증가 시 추가.

## 스키마 변경: 없음

---

## API 스펙

### PATCH `/api/v1/restaurants/{id}/close`
가게 폐업 처리. 인증 필요.

**Response 200**
```json
{
  "id": 42,
  "name": "명동돈가스",
  "status": "CLOSED",
  "closedAt": "2026-06-23T10:00:00Z"
}
```

**Error**
- `404 RESTAURANT_NOT_FOUND` — 존재하지 않는 id
- `409 ALREADY_CLOSED` — 이미 CLOSED/RELOCATED 상태

**비즈니스 규칙 (폐업=박제)**
1. `Restaurant.close()` 호출 (status=CLOSED, closedAt=now)
2. 해당 가게의 `is_current=true` 인 Vote 를 `is_current=false` 로 변경 (투표 박제)
3. 해당 Vote 를 가진 `User.currentVoteId = null` 로 갱신
4. `Restaurant.voteCount` 는 변경하지 않음 (박제: 표 수 보존, 랭킹에서만 제외됨)
5. 모든 변경은 단일 트랜잭션

---

### PATCH `/api/v1/restaurants/{id}/relocate`
가게 이전 처리. 인증 필요.

**Request Body**
```json
{
  "newKakaoPlaceId": "12345678"
}
```

**Response 200**
```json
{
  "oldRestaurantId": 42,
  "newRestaurantId": 99,
  "movedVoteCount": 37
}
```

**Error**
- `404 RESTAURANT_NOT_FOUND` — 기존 가게 없음
- `404 NEW_PLACE_NOT_FOUND` — 카카오 place_id 로 등록된 가게 없음 (이전 대상은 미리 등록되어 있어야 함)
- `409 ALREADY_CLOSED` — 이미 CLOSED/RELOCATED 상태
- `409 DUPLICATE_PLACE` — `newKakaoPlaceId` 가 기존 가게와 동일

---

## 이전(Relocate) 비즈니스 규칙 — 상세

> 1인 1표 제약(`votes (user_id) WHERE is_current = TRUE`)에 의해, 한 유저가 기존 가게와 새 가게 모두에 `is_current=true` 를 가질 수 없다. 별도 방어 코드 불필요.

### 처리 순서 (단일 트랜잭션)

**Step 1: 이관 대상 조회**
```java
// 기존 가게에 is_current=true 인 Vote 목록 조회 (유저 ID 수집 필요)
List<Vote> currentVotes = voteRepository.findByRestaurantIdAndCurrentIsTrue(oldRestaurantId);
int movedVoteCount = currentVotes.size();
```

**Step 2: 기존 Vote 아카이브 (벌크 가능)**
```java
// JPQL 벌크 UPDATE — 성능
@Modifying
@Query("UPDATE Vote v SET v.current = false WHERE v.restaurantId = :oldId AND v.current = true")
int archiveCurrentVotes(@Param("oldId") Long oldId);
```

**Step 3: 새 Vote 생성 (유저별 개별 처리 — 벌크 불가)**

각 유저마다 새 Vote 를 INSERT 해야 한다 (Vote.id 가 필요하므로 벌크 INSERT 불가).
`saveAll()` 로 일괄 호출하되, N건 개별 INSERT 임을 인지할 것.

```java
List<Vote> newVotes = currentVotes.stream()
    .map(v -> Vote.cast(v.getUserId(), newRestaurant.getId()))
    .toList();
voteRepository.saveAll(newVotes);
```

**Step 4: User.currentVoteId 갱신 (유저별 개별 처리 — 벌크 불가)**

각 유저의 `currentVoteId` 를 새 Vote.id 로 갱신. 유저마다 다른 값이므로 벌크 UPDATE 불가.

```java
for (int i = 0; i < currentVotes.size(); i++) {
    User user = userRepository.findById(currentVotes.get(i).getUserId())
        .orElseThrow(...);
    user.pointCurrentVoteTo(newVotes.get(i).getId());
}
```

> N+1 우려: relocate 는 운영 빈도가 극히 낮으므로 (수동, 가게 이전 시) 허용.
> 유저 수가 극단적으로 많을 경우를 대비해 `userRepository.findAllById(userIds)` 로 한 번에 조회 후 Map 으로 매핑하는 것을 권장.

**Step 5: voteCount 조정**

`Restaurant` 에는 `increaseVoteCount()` (+1), `decreaseVoteCount()` (-1) 만 존재한다.
이전은 운영 빈도가 극히 낮으므로 **도메인 메서드에 `adjustVoteCount(int delta)` 를 추가**한다.

```java
// Restaurant.java 에 추가
public void adjustVoteCount(int delta) {
    this.voteCount = Math.max(0, this.voteCount + delta);
}
```

```java
// RestaurantService 에서 사용
oldRestaurant.adjustVoteCount(-movedVoteCount);
newRestaurant.adjustVoteCount(movedVoteCount);
```

**Step 6: 기존 가게 상태 변경**
```java
oldRestaurant.relocateTo(newRestaurant);
// relocateTo() 에서: status=RELOCATED, relocatedToId=newRestaurant.id
// updatedAt 은 @PreUpdate 가 자동 갱신 — RELOCATED 시점은 updatedAt 으로 추적
```

### 낙관적 락 충돌 대응

두 Restaurant 의 `@Version` 이 동시에 변경되므로 `OptimisticLockingFailureException` 가능.
relocate 는 운영 빈도가 극히 낮으므로 `@Retryable` 으로 처리한다.

```java
@Retryable(retryFor = OptimisticLockingFailureException.class, maxAttempts = 3)
@Transactional
public RelocateResponse relocate(Long oldId, RelocateRequest request) { ... }
```

`spring-retry` 의존성 추가 필요 (없다면 수동 재시도 루프도 허용).

---

## 구현 가이드

### 파일 위치
- `RestaurantController` 에 두 엔드포인트 추가
- `RestaurantService` 에 `close()`, `relocate()` 메서드 추가
- `RelocateRequest` record 추가
- `CloseResponse`, `RelocateResponse` record 추가

### 도메인 메서드

```java
// Restaurant.java — 이미 존재
public void close() { ... }

// Restaurant.java — 추가 필요
public void relocateTo(Restaurant newRestaurant) {
    this.status = RestaurantStatus.RELOCATED;
    this.relocatedToId = newRestaurant.getId();
}

public void adjustVoteCount(int delta) {
    this.voteCount = Math.max(0, this.voteCount + delta);
}
```

### VoteRepository — 추가 쿼리
```java
List<Vote> findByRestaurantIdAndCurrentIsTrue(Long restaurantId);

@Modifying
@Query("UPDATE Vote v SET v.current = false WHERE v.restaurantId = :restaurantId AND v.current = true")
int archiveCurrentVotes(@Param("restaurantId") Long restaurantId);
```

### 금지 사항
- Vote hard delete 금지 — `is_current=false` 로 박제
- Restaurant hard delete 금지 — status 로만 관리
- ADMIN 롤/권한 체계 도입 금지 (MVP)
- Flyway 마이그레이션 파일 생성 금지

## 완료 조건
- [ ] `PATCH /close` — 이후 해당 가게 `/ranking` 에서 제거됨
- [ ] `PATCH /close` — 투표 유저의 `GET /api/v1/me` 에서 `currentVote: null`
- [ ] `PATCH /close` — vote_count 는 변경 없음 (박제)
- [ ] `PATCH /relocate` — 기존 유저의 `currentVote` 가 새 가게로 이동
- [ ] `PATCH /relocate` — 기존 가게 `vote_count` 감소, 새 가게 `vote_count` 증가
- [ ] 이미 CLOSED 가게에 close 재요청 → 409
- [ ] `./gradlew test` 통과

## 테스트 케이스
- 표 10개인 가게 폐업 → `voteCount=10` 유지, 랭킹에서 제외, 유저 10명 currentVoteId=null
- 표 5개인 가게 이전(새 가게에 표 3개 있음) → 새 가게 voteCount=8, 기존 가게 voteCount=0+RELOCATED
- 존재하지 않는 id → 404
- RELOCATED 가게 이전 재시도 → 409
- 이전 시 기존 유저의 vote-history 에 이전 기록 남음 (old vote is_current=false + new vote is_current=true)
