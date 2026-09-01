-- ACTIVE 가게가 0개인 날과 다중 인스턴스 동시 실행도 날짜 단위로 한 번만 완료하기 위한 마커.
CREATE TABLE ranking_daily_snapshot_runs (
    snapshot_date DATE      PRIMARY KEY,
    captured_at   TIMESTAMP NOT NULL
);
