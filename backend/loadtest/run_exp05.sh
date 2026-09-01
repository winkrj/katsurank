#!/bin/sh

set -eu

app_pid=${APP_PID:?APP_PID is required}
session_cookie=${SESSION_COOKIE:?SESSION_COOKIE is required}
restaurant_a=${RESTAURANT_A:?RESTAURANT_A is required}
restaurant_b=${RESTAURANT_B:?RESTAURANT_B is required}
results_root=${RESULTS_ROOT:-loadtest/results/exp05}
runs=${RUNS:-3}
baseline_seconds=${BASELINE_SECONDS:-30}
hold_seconds=${HOLD_SECONDS:-120}
cleanup_seconds=${CLEANUP_SECONDS:-30}
measurement_votes=${MEASUREMENT_VOTES:-20}
vote_settle_millis=${VOTE_SETTLE_MILLIS:-1200}
event_timeout_millis=${EVENT_TIMEOUT_MILLIS:-5000}
vote_budget_seconds=$(( (measurement_votes + 3) * (vote_settle_millis + event_timeout_millis + 999) / 1000 ))
max_duration_seconds=$((baseline_seconds + 3 * hold_seconds + cleanup_seconds + vote_budget_seconds + 120))
collector_pid=

cleanup_collector() {
  if [ -n "$collector_pid" ]; then
    kill "$collector_pid" 2>/dev/null || true
    wait "$collector_pid" 2>/dev/null || true
    collector_pid=
  fi
}

run_node() {
  if command -v caffeinate >/dev/null 2>&1; then
    caffeinate -dimsu node "$@"
  else
    node "$@"
  fi
}

trap cleanup_collector EXIT
trap 'exit 130' INT TERM

mkdir -p "$results_root"

run=1
while [ "$run" -le "$runs" ]; do
  run_dir="$results_root/run-$run"
  mkdir -p "$run_dir"
  APP_PID="$app_pid" OUTPUT_FILE="$run_dir/metrics.csv" MAX_DURATION_SECONDS="$max_duration_seconds" \
    sh loadtest/collect_exp05_metrics.sh > "$run_dir/collector.log" 2>&1 &
  collector_pid=$!

  set +e
  APP_PID="$app_pid" SESSION_COOKIE="$session_cookie" RESTAURANT_A="$restaurant_a" RESTAURANT_B="$restaurant_b" \
    OUTPUT_DIR="$run_dir" BASELINE_SECONDS="$baseline_seconds" HOLD_SECONDS="$hold_seconds" \
    CLEANUP_SECONDS="$cleanup_seconds" MEASUREMENT_VOTES="$measurement_votes" \
    VOTE_SETTLE_MILLIS="$vote_settle_millis" EVENT_TIMEOUT_MILLIS="$event_timeout_millis" \
    run_node loadtest/exp05_sse_clients.mjs > "$run_dir/client.log" 2>&1
  client_status=$?
  set -e

  cleanup_collector
  if [ "$client_status" -ne 0 ]; then
    printf 'EXP-05 run %s failed; measurement stopped before further runs\n' "$run" >&2
    exit "$client_status"
  fi
  if ! awk -F, 'NR == 1 { columns=NF } NR > 1 && NF != columns { exit 1 } END { if (NR < 2) exit 1 }' "$run_dir/metrics.csv"; then
    printf 'EXP-05 run %s collector output is missing or malformed\n' "$run" >&2
    exit 1
  fi
  run=$((run + 1))
done

python3 -B loadtest/analyze_exp05.py "$results_root"
