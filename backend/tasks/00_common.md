# 공통 컨벤션 (모든 태스크 공통 참조)

## rank 계산 정책

rank 는 두 가지 맥락에서 쓰인다. **방식이 다르며, 동점 시 결과가 1~2 차이날 수 있다.** MVP 에서 허용.

### 목록(리스트) 랭킹 — 위치 기반

`GET /api/v1/ranking`, `GET /api/v1/restaurants` 등 정렬된 목록에서 사용.

```
정렬: vote_count DESC, id ASC
rank = offset + index + 1   (목록 내 위치)
```

동점이면 id 가 작은(먼저 등록된) 가게가 높은 순위. **모든 가게에 고유한 rank 가 부여된다.**
예: voteCount [10, 5, 5] → rank [1, 2, 3]

### 단건 조회 — 집계 기반 (근사)

`GET /api/v1/restaurants/{id}`, `GET /api/v1/me` 등 단건 rank 표시에 사용.

```java
long rank = restaurantRepository.countByStatusAndVoteCountGreaterThan(ACTIVE, voteCount) + 1;
```

동점 가게는 **같은 rank** 를 받는다.
예: voteCount [10, 5, 5] → rank [1, 2, 2]

> 이 차이는 MVP 에서 허용한다. V1.1 에서 윈도우 함수(`RANK() OVER`) 도입 시 통일 검토.

---

## 에러 응답 패턴

기존 `GlobalExceptionHandler` + `ApiException` 을 따른다. 새 예외 클래스는 `ApiException` 을 상속.

```java
// 예외 정의
public class LimitExceededException extends ApiException {
    public LimitExceededException() {
        super(HttpStatus.BAD_REQUEST, "LIMIT_EXCEEDED", "limit은 50 이하여야 합니다.");
    }
}

// 응답 형태 (GlobalExceptionHandler 가 자동 변환)
// HTTP 400
// { "code": "LIMIT_EXCEEDED", "message": "limit은 50 이하여야 합니다." }
```

컨트롤러에서 직접 `ResponseEntity.badRequest()` 를 반환하지 말 것 — 반드시 예외를 throw.

---

## 스키마 변경 원칙

- Flyway 마이그레이션이 필요한 경우 태스크에 명시한다.
- 명시되지 않은 태스크에서는 **마이그레이션 파일을 생성하지 말 것.**
- 현재 마이그레이션: V1 (init), V2 (spring_session), V3 (restaurant_optimistic_lock).
- 다음 마이그레이션 번호: **V4**.
