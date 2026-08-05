\set ON_ERROR_STOP on

-- 카츠랭 부하테스트용 독립 시드.
-- 실행: psql -U katsurank -d katsurank -f backend/loadtest/seed.sql
-- 실제 데이터는 건드리지 않고 kakao_place_id='loadtest-*', nickname='LOADTEST-*' 데이터만 재생성한다.

BEGIN;

CREATE TEMP TABLE loadtest_restaurant_ids ON COMMIT DROP AS
SELECT id
FROM restaurants
WHERE kakao_place_id LIKE 'loadtest-%';

CREATE TEMP TABLE loadtest_user_ids ON COMMIT DROP AS
SELECT id
FROM users
WHERE kakao_id >= 900000000000000
  AND kakao_id < 900001000000000
  AND nickname LIKE 'LOADTEST-%';

-- 순환 FK(users.current_vote_id -> votes.id)를 먼저 해제한 뒤 인공 시드만 정리한다.
UPDATE users
SET current_vote_id = NULL
WHERE current_vote_id IN (
    SELECT v.id
    FROM votes v
    WHERE v.restaurant_id IN (SELECT id FROM loadtest_restaurant_ids)
       OR v.user_id IN (SELECT id FROM loadtest_user_ids)
);

DELETE FROM votes
WHERE restaurant_id IN (SELECT id FROM loadtest_restaurant_ids)
   OR user_id IN (SELECT id FROM loadtest_user_ids);

DELETE FROM restaurants
WHERE id IN (SELECT id FROM loadtest_restaurant_ids);

DELETE FROM users
WHERE id IN (SELECT id FROM loadtest_user_ids);

-- 기존 ACTIVE 가게는 보존하고 전체 ACTIVE가 정확히 2,000건이 되도록 부족분만 만든다.
WITH existing AS (
    SELECT count(*)::integer AS active_count
    FROM restaurants
    WHERE status = 'ACTIVE'
), desired AS (
    SELECT greatest(2000 - active_count, 0) AS seed_count
    FROM existing
), generated AS (
    SELECT n,
           CASE
               WHEN n <= 10 THEN 500 - ((n - 1) * 40)
               WHEN n <= 110 THEN 99 - floor(((n - 11) * 78.0) / 99)::integer
               ELSE CASE
                   WHEN mod(n - 111, 100) < 50 THEN 0
                   WHEN mod(n - 111, 100) < 68 THEN 1
                   WHEN mod(n - 111, 100) < 78 THEN 2
                   WHEN mod(n - 111, 100) < 85 THEN 3
                   WHEN mod(n - 111, 100) < 90 THEN 4
                   WHEN mod(n - 111, 100) < 94 THEN 5
                   WHEN mod(n - 111, 100) < 96 THEN 6
                   WHEN mod(n - 111, 100) < 98 THEN 7
                   WHEN mod(n - 111, 100) = 98 THEN 8
                   ELSE 9
               END
           END AS vote_count
    FROM desired
    CROSS JOIN LATERAL generate_series(1, seed_count) AS series(n)
)
INSERT INTO restaurants (
    kakao_place_id,
    name,
    address,
    road_address,
    latitude,
    longitude,
    kakao_category,
    phone,
    place_url,
    status,
    category,
    vote_count,
    relocated_to_id,
    closed_at,
    created_by,
    created_at,
    updated_at,
    version
)
SELECT 'loadtest-' || lpad(n::text, 6, '0'),
       'LOADTEST 돈까스 ' || lpad(n::text, 6, '0'),
       '서울특별시 부하테스트구 격자로 ' || n,
       '서울특별시 부하테스트구 격자로 ' || n,
       (37.4300000 + (mod(n - 1, 45) * 0.0040000))::numeric(10, 7),
       (126.7800000 + (mod(((n - 1) / 45), 45) * 0.0070000))::numeric(10, 7),
       '음식점 > 일식 > 돈까스',
       NULL,
       'https://place.map.kakao.com/loadtest-' || n,
       'ACTIVE',
       'TONKATSU',
       vote_count,
       NULL,
       NULL,
       NULL,
       TIMESTAMP '2026-08-01 00:00:00',
       TIMESTAMP '2026-08-01 00:00:00',
       0
FROM generated;

-- vote_count만큼 한 행씩 펼친 뒤 전역 순번을 부여한다. 반복문 없이 generate_series로 생성한다.
CREATE TEMP TABLE loadtest_vote_plan ON COMMIT DROP AS
SELECT r.id AS restaurant_id,
       row_number() OVER (ORDER BY r.id, vote_number)::bigint AS seed_user_number
FROM restaurants r
CROSS JOIN LATERAL generate_series(1, r.vote_count) AS vote_number
WHERE r.kakao_place_id LIKE 'loadtest-%';

CREATE UNIQUE INDEX loadtest_vote_plan_user_number
    ON loadtest_vote_plan (seed_user_number);

INSERT INTO users (
    kakao_id,
    nickname,
    profile_image,
    created_at,
    last_login_at,
    current_vote_id
)
SELECT 900000000000000 + seed_user_number,
       'LOADTEST-' || lpad(seed_user_number::text, 12, '0'),
       NULL,
       TIMESTAMP '2026-08-01 00:00:00',
       TIMESTAMP '2026-08-01 00:00:00',
       NULL
FROM loadtest_vote_plan;

INSERT INTO votes (
    user_id,
    restaurant_id,
    voted_at,
    is_current,
    version
)
SELECT u.id,
       plan.restaurant_id,
       TIMESTAMP '2026-08-01 00:00:00',
       TRUE,
       0
FROM loadtest_vote_plan plan
JOIN users u
  ON u.kakao_id = 900000000000000 + plan.seed_user_number;

UPDATE users u
SET current_vote_id = v.id
FROM votes v
WHERE v.user_id = u.id
  AND v.is_current
  AND u.kakao_id >= 900000000000000
  AND u.kakao_id < 900001000000000
  AND u.nickname LIKE 'LOADTEST-%';

COMMIT;

ANALYZE restaurants;
ANALYZE votes;

-- 데이터 규모와 분포 확인.
SELECT count(*) FILTER (WHERE status = 'ACTIVE') AS active_restaurants,
       count(*) FILTER (WHERE kakao_place_id LIKE 'loadtest-%') AS seeded_restaurants
FROM restaurants;

SELECT CASE
           WHEN vote_count BETWEEN 100 AND 500 THEN 'top_10_100_500'
           WHEN vote_count BETWEEN 10 AND 99 THEN 'next_100_10_99'
           ELSE 'tail_0_9'
       END AS vote_band,
       count(*) AS restaurants,
       min(vote_count) AS min_votes,
       max(vote_count) AS max_votes
FROM restaurants
WHERE kakao_place_id LIKE 'loadtest-%'
GROUP BY vote_band
ORDER BY min_votes DESC;

-- 반드시 0행이어야 한다.
SELECT r.id, r.vote_count, COUNT(v.id)
FROM restaurants r LEFT JOIN votes v
  ON v.restaurant_id = r.id AND v.is_current
GROUP BY r.id, r.vote_count
HAVING r.vote_count <> COUNT(v.id);

-- 합계도 동일해야 한다.
SELECT (SELECT sum(vote_count) FROM restaurants) AS restaurant_vote_count_sum,
       (SELECT count(*) FROM votes WHERE is_current) AS current_vote_rows;

-- 1인 1표 위반이 없어야 하므로 반드시 0행이어야 한다.
SELECT user_id, count(*)
FROM votes
WHERE is_current
GROUP BY user_id
HAVING count(*) > 1;
