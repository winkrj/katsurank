package com.katsurank.support;

public final class CleanUp {

    public static final String SQL_CLEAR_VOTES = "UPDATE users SET current_vote_id = NULL";
    public static final String SQL_DELETE_VOTES = "DELETE FROM votes";
    public static final String SQL_DELETE_RESTAURANTS = "DELETE FROM restaurants";

    private CleanUp() {
    }
}
