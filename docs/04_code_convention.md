# 코드 컨벤션

- **버전**: v1.0
- **작성일**: 2026-07-19
- **상태**: 초안 (팀 합의 후 "확정"으로 전환)

> 5년 이상 운영을 전제로 한다. 우선순위는 **가독성 > 영리함**, **명시성 > 암묵성**이다. 이 문서는 "왜 이렇게 정했는지"를 함께 남겨서, 나중에 규칙만 보고 판단이 안 서는 상황을 줄인다.
> 이 문서와 `CLAUDE.md`의 절대 제약이 충돌하면 `CLAUDE.md`가 우선한다. 이 문서는 그 제약 안에서의 세부 실행 규칙이다.

---

## 0. 이 문서의 스코프

다음 구조·응답 규칙은 백엔드 코드에 적용되었다.

- [x] 기존 컨트롤러의 성공 응답을 `ApiResponse<T>` 래퍼로 마이그레이션
- [x] 기능 패키지 내부를 계층 서브패키지(`controller/service/repository/dto/exception`)로 재구성

---

## 1. 아키텍처 원칙

3계층 고정: **Controller → Service → Repository**. `CLAUDE.md`의 절대 제약이며, 이 프로젝트 규모(1인 개발 + 협업자 1명)에서 UseCase/Port 인터페이스를 두는 풀 헥사고날 아키텍처는 간접 계층만 늘려 생산성을 해친다. 대신 클린 아키텍처의 핵심(의존 방향 규칙, 계층별 단일 책임)은 3계층 안에서 지킨다.

| 계층 | 책임 | 하지 말아야 할 것 |
|---|---|---|
| Controller | HTTP 요청 ↔ DTO 변환, 인증 principal 바인딩, status code 결정 | 비즈니스 로직, 트랜잭션, Repository 직접 호출 |
| Service | 트랜잭션 경계, 유스케이스 오케스트레이션, 도메인 객체 호출 | HTTP 개념(`HttpStatus`, `ResponseEntity`) 참조, DTO를 파라미터로 직접 받기(아래 4장 참조) |
| Repository | 순수 데이터 접근 (JPA / QueryDSL) | 비즈니스 규칙, 여러 애그리게잇을 조합한 판단 |
| Domain (Entity) | 비즈니스 규칙·불변식 | Spring/JPA 외 프레임워크 의존은 없지만, JPA 애노테이션 자체는 허용(순수 POJO 강박은 갖지 않는다 — 실용성 우선) |

의존 방향은 위에서 아래로만 향한다. Repository와 Entity는 Controller의 존재를 모른다.

---

## 2. 패키지 구조

기능별 패키지(package-by-feature) 안에 계층 서브패키지를 둔다.

```
restaurant/
  controller/  RestaurantController.java
  service/     RestaurantService.java
  client/      KakaoLocalClient.java (외부 HTTP API가 있는 기능만)
  repository/  RestaurantRepository.java, RestaurantQueryRepository.java
  dto/         RestaurantResponse.java, RestaurantRegisterRequest.java
  exception/   DuplicatePlaceException.java, CategoryNotAllowedException.java
  Restaurant.java              (엔티티는 기능 패키지 루트, 계층 서브패키지 아님)
  package-info.java
```

- `package-info.java`로 기능 책임을 한 줄 요약한다 (기존 관행 계승 — 이미 잘 되어 있던 부분).
- 여러 기능이 공유하는 코드만 `common/` 하위에 둔다. "혹시 나중에 쓸 것 같아서" 공용화하지 않는다 — 두 번째 사용처가 생길 때 옮긴다.
- Entity는 계층 서브패키지로 넣지 않는다. 도메인 모델은 "계층"이 아니라 기능 패키지 자체의 핵심이기 때문이다.

---

## 3. 네이밍 컨벤션

| 종류 | 접미사 | 예시 |
|---|---|---|
| 컨트롤러 | `Controller` | `RestaurantController` |
| 서비스 | `Service` | `RestaurantService` |
| Spring Data 리포지토리 | `Repository` | `RestaurantRepository` |
| QueryDSL 복잡 조회 | `QueryRepository` | `RestaurantQueryRepository` |
| 요청 DTO | `Request` | `RestaurantRegisterRequest` |
| 응답 DTO | `Response` | `RestaurantResponse` |
| 도메인 예외 | `Exception` | `DuplicatePlaceException` |

- 서비스 메서드는 동사로 시작한다 (`register`, `vote`, `relocate`). `process`, `handle`, `manage` 같은 의미 없는 동사는 쓰지 않는다 — 실제로 뭘 하는지 드러나야 한다.
- boolean 반환 메서드/필드는 `is`/`has`로 시작한다 (`isActive`, `hasVoted`).
- 축약어는 쓰지 않는다 (`rst` 대신 `restaurant`). 단, `id`, `dto`처럼 업계 표준 축약은 예외.

---

## 4. DTO / Request / Response 컨벤션

- 모든 DTO는 **record**. Entity를 API 응답으로 직접 노출하지 않는 것은 절대 규칙이다.
- **Request**: Bean Validation 애노테이션 필수. Service 메서드 파라미터로 Request record를 그대로 넘기지 않고, Service는 원시 타입/도메인 값을 파라미터로 받는다 — Service가 "HTTP 계층의 모양"을 몰라야 재사용·테스트가 쉽다.

```java
public record RestaurantRegisterRequest(
        @NotBlank String kakaoPlaceId,
        @NotBlank String name,
        @ValidCoordinate double latitude,
        @ValidCoordinate double longitude
) {
}

// Controller에서
restaurantService.register(request.kakaoPlaceId(), request.name(), request.latitude(), request.longitude());
```

- **Response**: 정적 팩토리 `from(Entity)` 패턴.

```java
public record RestaurantResponse(Long id, String name, String status, Instant createdAt) {

    public static RestaurantResponse from(Restaurant restaurant) {
        return new RestaurantResponse(
                restaurant.getId(),
                restaurant.getName(),
                restaurant.getStatus().name(),
                restaurant.getCreatedAt()
        );
    }
}
```

- 리스트 응답은 `PageResponse<T>`로 통일한다: `{ items, total, offset, limit }`.
- Request record의 형식·존재 검증은 Bean Validation으로 처리한다. 역직렬화 중 compact constructor가 던진 `IllegalArgumentException`은 일반적인 검증 오류와 다른 경로로 처리될 수 있으므로, Request에 같은 검증을 중복해서 넣지 않는다.
- `Coordinate`처럼 전송 계층과 무관하게 스스로 불변식을 지켜야 하는 **값 객체**는 compact constructor로 논리적 유효성을 검증한다.

```java
public record Coordinate(double latitude, double longitude) {
    public Coordinate {
        if (latitude < -90 || latitude > 90) {
            throw new IllegalArgumentException("latitude out of range: " + latitude);
        }
    }
}
```

---

## 5. API 응답 포맷 표준화

성공/실패 응답을 공통 `ApiResponse<T>`로 통일한다 (⚠️ 마이그레이션 필요, 0장 참조).

```json
// 성공
{ "success": true, "data": { "id": 1, "name": "..." }, "error": null }

// 실패
{ "success": false, "data": null, "error": { "code": "RESTAURANT_NOT_FOUND", "message": "..." } }
```

```java
public record ApiResponse<T>(boolean success, T data, ApiError error) {

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return new ApiResponse<>(false, null, new ApiError(code, message));
    }
}
```

- HTTP status code는 그대로 의미를 유지한다 (래퍼는 body 형태만 통일하는 것이지, status code로 성공/실패를 이원화하지 않는다). 즉 실패해도 `4xx`/`5xx` status는 그대로 내려주고, body만 `ApiResponse.error(...)` 형태다.

---

## 6. 예외 처리

- `@RestControllerAdvice` 기반 `GlobalExceptionHandler` 하나로 통일한다 (기존 관행 계승).
- 도메인 예외는 `HttpStatus`를 알지 못한다. `RuntimeException` 또는 HTTP에 의존하지 않는 도메인 예외 기반 클래스를 사용하고, `GlobalExceptionHandler`가 예외 타입이나 안정적인 에러 코드를 HTTP status로 매핑한다.
- 에러 코드는 `도메인_사유` 스네이크 대문자로 짓는다: `RESTAURANT_NOT_FOUND`, `VOTE_ALREADY_EXISTS`. 프론트가 메시지가 아니라 코드로 분기할 수 있어야 한다 — 메시지는 한국어로 자유롭게 바뀔 수 있지만 코드는 계약이다.

---

## 7. 도메인 모델 (Entity) 컨벤션

- Setter 금지. `@NoArgsConstructor(access = PROTECTED)` + 정적 팩토리(`Restaurant.register(...)`)로만 생성한다.
- 비즈니스 규칙과 불변식은 엔티티 메서드 안에 둔다 (`increaseVoteCount()`, `relocateTo()`, `close()`).
- Getter만 열어두고, 상태 변경은 의미 있는 이름의 메서드로만 가능하게 한다.
- 정적 팩토리 메서드 이름에 의미를 구분해서 담는다: `of()`는 검증 없는 단순 조립, `from()`은 다른 타입에서의 변환, 도메인 동사(`register`, `relocateTo`)는 비즈니스 규칙이 실행되는 생성/전이. 전부 `of`로 퉁치지 않는다 — 이름만 보고 "단순 조립인지 규칙이 실행되는지" 구분되어야 한다.
- JPA 엔티티의 `equals`/`hashCode`는 **id 기반으로 수동 구현**한다. Lombok `@EqualsAndHashCode`는 금지 — 지연 로딩 필드까지 전부 비교해 성능 사고와 `LazyInitializationException` 위험이 있다. 프록시와 실제 엔티티가 같은 영속 타입으로 비교되도록 `equals`와 `hashCode`에서 동일한 effective class 계산을 사용한다. `id == null`인 두 인스턴스는 자기 자신이 아닌 한 항상 다른 객체로 취급한다(영속화 전 엔티티는 동일성 비교가 의미 없다).

```java
@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || effectiveClass(this) != effectiveClass(o)) return false;
    Restaurant other = (Restaurant) o;
    return id != null && id.equals(other.getId());
}

@Override
public int hashCode() {
    return effectiveClass(this).hashCode();
}

private static Class<?> effectiveClass(Object entity) {
    return entity instanceof HibernateProxy proxy
            ? proxy.getHibernateLazyInitializer().getPersistentClass()
            : entity.getClass();
}
```

프록시를 사용하는 엔티티의 동등성 구현은 실제 엔티티, `EntityManager.getReference(...)`로 얻은 프록시, 미영속 엔티티 조합을 테스트해 `equals` 대칭성과 `hashCode` 계약을 검증한다.

- 연관 컬렉션을 반환하는 getter는 내부 리스트를 그대로 노출하지 않고 `List.copyOf(...)`로 감싼다 — 호출부가 `.add()`로 내부 상태를 오염시키는 걸 막는다.
- Query 메서드는 상태를 바꾸지 않는다(CQS, Command-Query Separation). Command 메서드는 상태를 변경하면서 실행 결과·생성된 식별자·도메인 결과를 반환할 수 있지만, 단순 조회까지 한 번에 처리하려고 반환값을 추가하지 않는다.
- 호출자가 빠짐없이 처리해야 하는 유한한 도메인 결과가 여러 개라면 boolean + 예외 조합 대신 **sealed interface**로 모델링한다 — 컴파일러가 분기 누락을 잡아준다.

```java
public sealed interface VoteResult permits Voted, AlreadyVotedElsewhere, NoChange {
}
public record Voted(Long restaurantId) implements VoteResult {}
public record AlreadyVotedElsewhere(Long previousRestaurantId) implements VoteResult {}
public record NoChange() implements VoteResult {}
```

- 시간이 필요한 로직은 `Instant.now()`를 직접 호출하지 않는다. Spring이 관리하는 Service/Application 계층에 `Clock`을 주입하고 `Instant.now(clock)`으로 얻은 시각을 엔티티 메서드에 전달한다. JPA 엔티티 자체에 `Clock`을 의존성 주입하지 않는다. 테스트에서는 `Clock.fixed(...)`로 시간 의존 로직(투표 마감, 통계 집계)을 안정적으로 검증한다.
- 기술적 감사 필드(`createdAt`/`updatedAt`)는 엔티티마다 `@PrePersist`/`@PreUpdate`를 반복하지 않고, `@MappedSuperclass` + `@EntityListeners(AuditingEntityListener.class)`의 `BaseTimeEntity`를 상속한다. `votedAt`·`closedAt`·`lastLoginAt`처럼 도메인 사건 자체를 나타내는 시각은 감사 필드와 구분해 도메인 동작에서 명시적으로 기록한다.
- 저장과 API 응답의 시각 필드는 항상 `Instant`(ISO-8601, `Z` 서픽스)다. 표시를 위한 KST 변환은 프론트 책임이다. 다만 "KST 기준 하루"처럼 지역 달력이 비즈니스 규칙에 포함된 경우에는 해당 규칙의 경계에서 명시적으로 `ZoneId`를 사용하고, 계산 결과는 다시 `Instant`로 변환해 저장한다.

---

## 8. 트랜잭션 & 동시성

- Service 메서드 단위로 `@Transactional`을 건다. 조회 전용 메서드는 `@Transactional(readOnly = true)`를 기본으로 한다.
- 낙관적 락(`@Version`) 충돌은 `OptimisticLockingFailureException`을 잡아 기능의 경합 특성에 맞는 제한된 횟수만 재시도한다. 실패한 트랜잭션과 영속성 컨텍스트를 재사용하지 않고, **각 시도는 새로운 트랜잭션**에서 처음부터 실행한다.
- 같은 Spring 빈 내부에서 `@Transactional` 메서드를 직접 호출하면 프록시를 거치지 않아 트랜잭션이 적용되지 않는다(self-invocation). 재시도 경계는 `TransactionTemplate`, 별도 트랜잭션 빈, 또는 프록시를 실제로 거치는 호출로 구성한다.
- 알림 발송, 랭킹 캐시 무효화 같은 부수효과는 같은 트랜잭션 안에서 직접 호출하지 않는다. `@TransactionalEventListener(phase = AFTER_COMMIT)`는 커밋 성공 이후 실행되어야 하지만 유실되어도 복구 가능한 작업에 사용한다. 리스너에서 DB를 변경해야 하면 별도 트랜잭션을 사용하며, 반드시 전달되어야 하는 외부 메시지·이벤트는 Outbox처럼 DB 커밋과 함께 내구성 있게 기록하는 방식을 사용한다. AFTER_COMMIT 리스너 실패는 이미 커밋된 원 트랜잭션을 롤백할 수 없다.

---

## 9. Lombok 사용 가이드

| 허용 | 금지 | 이유 |
|---|---|---|
| `@Getter` | `@Setter` | 상태 변경은 의미 있는 메서드로만 |
| `@NoArgsConstructor(access = PROTECTED)` | `@AllArgsConstructor`, `@Builder`(Entity에) | 생성은 정적 팩토리로 강제 — 불변식 검증 지점을 하나로 유지 |
| `@Slf4j` | `@Data` | `@Data`는 위 둘을 한 번에 열어버려 캡슐화가 무너짐 |
| | `@EqualsAndHashCode` | 위 7장 참조 (id 기반 수동 구현) |

DTO(record)에는 Lombok을 쓰지 않는다 — record 자체가 이미 불변·`equals`/`hashCode`/`toString`을 제공한다.

---

## 10. 클린 코드 세부 원칙

- 함수는 한 가지 일만 한다. 함수 하나가 20~30줄을 넘어가면 분리를 의심한다.
- 매직 넘버·매직 문자열은 상수화한다 (`MAX_RETRY`, `"KAKAO"` 같은 리터럴이 반복되면 상수로).
- 주석은 **WHY만** 쓴다. "무엇을 하는지"는 코드/네이밍으로 드러나야 하고, 주석은 "왜 이렇게 짰는지"(숨은 제약, 특정 버그의 우회, 읽는 사람이 놀랄 만한 동작)에만 쓴다.
- 조기 반환(early return)으로 중첩을 줄인다. 3단계 이상 중첩되면 함수 분리나 조기 반환을 의심한다.
- 접근 제어자는 기본이 **package-private**이다. 같은 패키지 안에서만 쓰는 매퍼·헬퍼·QueryDSL predicate 빌더는 `public`을 붙이지 않는다. `public`은 다른 패키지가 실제로 써야 할 때만 최소로 부여한다 — 무분별한 `public`은 결합도를 숨긴다.

---

## 11. 검증(Validation)

- 표준 Bean Validation 애노테이션으로 충분한 경우 그대로 쓴다 (`@NotBlank`, `@Size` 등).
- 좌표 범위, 영업시간 형식처럼 도메인 특화되고 반복되는 검증은 범용 애노테이션 조합 대신 커스텀 제약 애노테이션(`@ValidCoordinate`)으로 만들어 의도를 이름에 드러낸다.

---

## 12. N+1 및 조회 전략

- 연관관계는 기본 `FetchType.LAZY`. `EAGER`는 쓰지 않는다.
- N+1이 실측으로 발생하는 조회 지점만, 그 자리에서 QueryDSL fetch join 또는 `@EntityGraph`로 명시적으로 해결한다. "왜 이 메서드만 fetch join을 쓰는지"가 코드 구조 자체로 드러나야 한다(전역 설정으로 뭉개지 않는다).
- Repository 인터페이스(Spring Data JPA)에는 단순 CRUD/파생 쿼리만 둔다. 복잡한 동적 조회는 `XxxQueryRepository`(QueryDSL)로 분리한다.
- `Optional`은 반환 타입 전용이다. 필드·파라미터·컬렉션 요소로 쓰지 않는다. Repository 밖으로 `Optional`을 그대로 흘려보내지 않고, Service에서 `orElseThrow(...)`로 즉시 해소한다.

---

## 13. 로깅

- `logstash-logback-encoder` 기반 구조화 로깅을 쓴다. 인코더 추가만으로 로그 인자가 검색 가능한 JSON 필드가 되는 것은 아니므로, SLF4J fluent API의 `addKeyValue(...)` 등으로 주요 값을 명시적인 key-value 필드로 기록한다(문자열 조합 로그 지양).
- 전화번호, 카카오 액세스 토큰 등 민감정보는 마스킹 없이 로깅하지 않는다.
- 모든 요청에 `traceId`를 MDC에 심어, 하나의 요청에 걸친 로그 라인을 추적할 수 있게 한다. MDC 키와 응답 헤더 명칭은 애플리케이션 전체에서 하나로 통일한다.
- `e.printStackTrace()` 금지. 항상 로거를 통해 남긴다.

---

## 14. 아키텍처 규칙의 강제 (ArchUnit)

계층 의존 규칙("Controller는 Repository를 직접 참조할 수 없다" 등)은 리뷰어의 눈에만 맡기지 않고 테스트로 강제한다. 규칙이 깨지면 코드 리뷰 전에 빌드가 먼저 실패한다.

```java
@AnalyzeClasses(packages = "com.katsurank")
class ArchitectureTest {

    @ArchTest
    static final ArchRule controllers_should_not_depend_on_repositories =
            noClasses().that().resideInAPackage("..controller..")
                    .should().dependOnClassesThat().resideInAPackage("..repository..");

    @ArchTest
    static final ArchRule entities_should_not_depend_on_web_layer =
            noClasses().that().areAnnotatedWith(Entity.class)
                    .should().dependOnClassesThat()
                    .resideInAnyPackage("..controller..", "..dto..");
}
```

(도입 시 `com.tngtech.archunit:archunit-junit5` 의존성 추가 필요 — 후속 작업.)

---

## 15. 테스트 컨벤션

- 계층별 전략: Service는 Mock 기반 단위 테스트, Controller는 `@WebMvcTest`, 여러 계층이 얽히는 시나리오는 통합 테스트.
- Given-When-Then 구조로 작성하고, 테스트 메서드명은 한글 `@DisplayName`으로 의도를 드러낸다.
- 테스트 데이터는 매직값 하드코딩 대신 픽스처/빌더로 구성한다 (기존 `support/` 픽스처, `@WithMockAuthPrincipal` 커스텀 애노테이션 패턴 계승).

---

## 16. 문서 관리

이 문서 자체도 SSOT다. 새 규칙이나 예외 케이스가 생기면 여기에 추가한다. 코드 리뷰에서 "13.4 위반"처럼 섹션 번호로 인용할 수 있게, 번호 체계를 유지한다.
