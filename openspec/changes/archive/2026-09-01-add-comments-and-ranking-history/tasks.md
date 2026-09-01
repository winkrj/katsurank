## 1. Database foundation

- [x] 1.1 Add a Flyway migration for `comments` and `ranking_daily_snapshots` with the specified foreign keys, uniqueness constraints, composite key, and query indexes.
- [x] 1.2 Update test cleanup support so comments and ranking snapshots are removed before their referenced restaurants and users.

## 2. Restaurant comments

- [x] 2.1 Add comment domain, repository, DTO records, and domain exceptions, including trimmed 1–500 character content and owner-controlled mutation.
- [x] 2.2 Add transactional comment service operations for paged listing, create, update, and hard delete with restaurant status, ownership, path consistency, and concurrent uniqueness handling.
- [x] 2.3 Add nested comment REST endpoints with public GET, authenticated mutations, common response wrappers, validation, HTTP status mappings, and OpenAPI documentation.
- [x] 2.4 Add repository/service tests for one-comment uniqueness, author projection, ordering, paging, content validation, restaurant states, ownership, path mismatch, deletion, and recreation.
- [x] 2.5 Add controller/security tests for anonymous listing, authenticated CRUD, CSRF enforcement, response schemas, and comment error responses.

## 3. Daily restaurant ranking history

- [x] 3.1 Add ranking snapshot persistence and an idempotent native INSERT-SELECT that captures all ACTIVE restaurants using PostgreSQL competition ranking and KST snapshot dates.
- [x] 3.2 Add the KST-midnight scheduler and transactional snapshot service while keeping it independent from the TOP 20 in-memory ranking cache.
- [x] 3.3 Add the public restaurant ranking-history endpoint and DTO query that returns at most seven actual snapshots in ascending date order and validates restaurant existence.
- [x] 3.4 Add tests for KST date handling, UTC capture time, tie ranks, coordinate-independent inclusion, inactive exclusion, repeated generation idempotency, seven-entry limiting, ordering, empty history, missing restaurants, and retained inactive history.
- [x] 3.5 Add controller/security tests for anonymous history access and the API response/error schemas.

## 4. Integration and documentation

- [x] 4.1 Update the relevant product scope and backend data/API SSOT documents with the finalized comment and daily ranking-history policies.
- [x] 4.2 Run focused comment and ranking-history tests, then run `./gradlew test` and `git diff --check`; fix failures within the bounded test/fix loop.
- [x] 4.3 Perform the required independent read-only review, address Critical/High findings, rerun affected tests, and report any residual risks or unverified areas.
