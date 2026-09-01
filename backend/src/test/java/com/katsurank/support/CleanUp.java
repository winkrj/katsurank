package com.katsurank.support;

public final class CleanUp {

    public static final String SQL_CLEAR_VOTES = "UPDATE users SET current_vote_id = NULL";
    public static final String SQL_DELETE_COMMENTS = "DELETE FROM comments";
    public static final String SQL_DELETE_RANKING_SNAPSHOTS = "DELETE FROM ranking_daily_snapshots";
    public static final String SQL_DELETE_RANKING_SNAPSHOT_RUNS = "DELETE FROM ranking_daily_snapshot_runs";
    public static final String SQL_DELETE_VOTES = "DELETE FROM votes";
    public static final String SQL_DELETE_RESTAURANTS = "DELETE FROM restaurants";

    private CleanUp() {
    }
}
