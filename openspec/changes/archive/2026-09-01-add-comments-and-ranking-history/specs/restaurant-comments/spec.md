## ADDED Requirements

### Requirement: Public restaurant comment listing
The system SHALL allow any user to retrieve non-deleted comments for an existing restaurant through `GET /api/v1/restaurants/{restaurantId}/comments`. The response SHALL use the common offset-based page format, sort by creation time descending and ID descending, default `offset` to 0 and `limit` to 20, and accept a maximum limit of 100.

#### Scenario: Anonymous user lists comments
- **WHEN** an unauthenticated user requests comments for an existing restaurant
- **THEN** the system returns `200 OK` with comments in newest-created-first order and page metadata

#### Scenario: Restaurant has no comments
- **WHEN** comments are requested for an existing restaurant with no comments
- **THEN** the system returns `200 OK` with an empty `items` list and total 0

#### Scenario: Restaurant does not exist
- **WHEN** comments are requested for a nonexistent restaurant
- **THEN** the system returns `404 Not Found` with error code `RESTAURANT_NOT_FOUND`

#### Scenario: Invalid pagination
- **WHEN** offset is negative or limit is outside 1 through 100
- **THEN** the system returns `400 Bad Request`

### Requirement: One comment per user per restaurant
The system SHALL allow an authenticated user to create at most one comment for each ACTIVE restaurant through `POST /api/v1/restaurants/{restaurantId}/comments`. It MUST enforce this invariant with a database UNIQUE constraint on restaurant and user in addition to application handling.

#### Scenario: User creates first comment
- **WHEN** an authenticated user submits valid content to an ACTIVE restaurant on which they have no comment
- **THEN** the system stores the comment and returns `201 Created`

#### Scenario: Anonymous user attempts creation
- **WHEN** an unauthenticated user attempts to create a comment
- **THEN** the system returns `401 Unauthorized`

#### Scenario: User creates duplicate comment
- **WHEN** a user who already has a comment on the restaurant attempts another creation, including concurrent duplicate requests
- **THEN** the system keeps at most one comment and returns `409 Conflict` with error code `COMMENT_ALREADY_EXISTS` for the rejected request

#### Scenario: User comments on inactive restaurant
- **WHEN** an authenticated user attempts to create a comment on a CLOSED or RELOCATED restaurant
- **THEN** the system returns `409 Conflict` with error code `RESTAURANT_NOT_COMMENTABLE`

### Requirement: Comment content validation
The system MUST trim leading and trailing whitespace and store comment content whose trimmed length is between 1 and 500 characters.

#### Scenario: Valid content
- **WHEN** a create or update request contains content with a trimmed length between 1 and 500
- **THEN** the system stores the trimmed content

#### Scenario: Blank content
- **WHEN** a create or update request contains null, empty, or whitespace-only content
- **THEN** the system returns `400 Bad Request` with the common validation error response

#### Scenario: Content exceeds maximum length
- **WHEN** a create or update request contains trimmed content longer than 500 characters
- **THEN** the system returns `400 Bad Request` with the common validation error response

### Requirement: Comment response author data
The system SHALL return each comment as a DTO and MUST NOT expose a JPA entity directly. The response SHALL contain the comment ID, restaurant ID, content, author ID, current author nickname, current author profile image, creation time, and update time.

#### Scenario: Author profile changed after comment creation
- **WHEN** a comment is retrieved after its author profile has changed
- **THEN** the response contains the author's current nickname and profile image

### Requirement: Comment modification by owner
The system SHALL allow only the authenticated comment owner to update their comment through `PATCH /api/v1/restaurants/{restaurantId}/comments/{commentId}`. Updates SHALL be allowed only while the restaurant is ACTIVE.

#### Scenario: Owner updates comment
- **WHEN** the authenticated owner submits valid content for a comment belonging to the ACTIVE restaurant in the URL
- **THEN** the system updates its content and update time and returns `200 OK`

#### Scenario: Non-owner updates comment
- **WHEN** an authenticated user attempts to update another user's comment
- **THEN** the system returns `403 Forbidden` with error code `COMMENT_FORBIDDEN`

#### Scenario: Comment and restaurant path mismatch on update
- **WHEN** the requested comment does not belong to the restaurant in the URL
- **THEN** the system returns `404 Not Found` with error code `COMMENT_NOT_FOUND`

#### Scenario: Owner updates comment on inactive restaurant
- **WHEN** the owner attempts to update a comment after its restaurant becomes CLOSED or RELOCATED
- **THEN** the system returns `409 Conflict` with error code `RESTAURANT_NOT_COMMENTABLE`

### Requirement: Comment deletion by owner
The system SHALL allow only the authenticated comment owner to permanently delete their comment through `DELETE /api/v1/restaurants/{restaurantId}/comments/{commentId}`. Deletion SHALL remain available regardless of restaurant status.

#### Scenario: Owner deletes comment
- **WHEN** the authenticated owner deletes a comment belonging to the restaurant in the URL
- **THEN** the system hard deletes the comment and returns `204 No Content`

#### Scenario: Non-owner deletes comment
- **WHEN** an authenticated user attempts to delete another user's comment
- **THEN** the system returns `403 Forbidden` with error code `COMMENT_FORBIDDEN`

#### Scenario: Comment does not exist on delete
- **WHEN** the comment does not exist or does not belong to the restaurant in the URL
- **THEN** the system returns `404 Not Found` with error code `COMMENT_NOT_FOUND`

#### Scenario: User comments again after deletion
- **WHEN** a user creates a new valid comment after deleting their previous comment on an ACTIVE restaurant
- **THEN** the system accepts it as a new comment and returns `201 Created`
