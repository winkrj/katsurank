## ADDED Requirements

### Requirement: Daily Seoul ranking snapshots
The system SHALL capture one daily snapshot for every ACTIVE restaurant at KST midnight. Each snapshot SHALL store the KST snapshot date, restaurant ID, competition rank, vote count, and a UTC capture timestamp.

#### Scenario: Daily snapshot succeeds
- **WHEN** the daily scheduler runs at `00:00 Asia/Seoul`
- **THEN** the system stores a snapshot for every restaurant that is ACTIVE in the snapshot transaction

#### Scenario: Inactive restaurants are excluded
- **WHEN** a restaurant is CLOSED, RELOCATED, PENDING, or REJECTED at snapshot time
- **THEN** the system does not create a snapshot for that restaurant on that date

#### Scenario: Snapshot dates and timestamps use defined zones
- **WHEN** a snapshot is stored
- **THEN** its snapshot date represents the calendar date in `Asia/Seoul` and its capture timestamp is stored in UTC

### Requirement: Historical rank matches current competition ranking
The system MUST calculate snapshot rank across the complete ACTIVE Seoul ranking by descending vote count, using competition ranking so tied vote counts share a rank and the following rank skips the tied positions.

#### Scenario: Tied vote counts
- **WHEN** ACTIVE restaurants have vote counts 10, 5, 5, and 3 at snapshot time
- **THEN** their stored ranks are 1, 2, 2, and 4 respectively

#### Scenario: Restaurants without map coordinates
- **WHEN** an ACTIVE restaurant has no latitude or longitude
- **THEN** it remains included in the daily Seoul ranking snapshot

### Requirement: Idempotent snapshot creation
The system MUST enforce at most one snapshot per restaurant and KST date with a database primary key or unique constraint, and repeated generation for the same date SHALL NOT overwrite the first captured values.

#### Scenario: Snapshot generation repeats for the same date
- **WHEN** snapshot generation is invoked more than once for the same KST date
- **THEN** the system retains exactly one unchanged snapshot per restaurant for that date and completes without a duplicate-key failure

### Requirement: Public seven-entry ranking history
The system SHALL allow any user to retrieve an existing restaurant's seven most recent actual daily snapshots through `GET /api/v1/restaurants/{restaurantId}/ranking-history`. The response SHALL contain at most seven items ordered by snapshot date ascending, and each item SHALL contain date, rank, and vote count.

#### Scenario: Anonymous user retrieves seven-entry history
- **WHEN** an unauthenticated user requests history for a restaurant with more than seven snapshots
- **THEN** the system returns `200 OK` with only the seven most recent snapshots ordered oldest to newest

#### Scenario: Restaurant has fewer than seven snapshots
- **WHEN** history is requested for an existing restaurant with fewer than seven snapshots
- **THEN** the system returns only the actual snapshots without synthesizing missing dates or live ranking values

#### Scenario: Restaurant has no snapshots
- **WHEN** history is requested for an existing restaurant with no snapshots
- **THEN** the system returns `200 OK` with an empty list

#### Scenario: Restaurant does not exist
- **WHEN** history is requested for a nonexistent restaurant
- **THEN** the system returns `404 Not Found` with error code `RESTAURANT_NOT_FOUND`

#### Scenario: Inactive restaurant retains history
- **WHEN** history is requested after a restaurant becomes CLOSED or RELOCATED
- **THEN** the system returns its previously captured snapshots and does not merge history from another restaurant
