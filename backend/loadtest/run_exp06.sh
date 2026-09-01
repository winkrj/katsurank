#!/bin/sh

set -eu

app_pid=${APP_PID:?APP_PID is required}
session_cookie=${SESSION_COOKIE:?SESSION_COOKIE is required}
restaurant_a=${RESTAURANT_A:?RESTAURANT_A is required}
restaurant_b=${RESTAURANT_B:?RESTAURANT_B is required}
results_root=${RESULTS_ROOT:-loadtest/results/exp06}
runs=${RUNS:-3}
target_connections=${TARGET_CONNECTIONS:-1000}
periods_ms=${PERIODS_MS:-1000,500,200,100}
idle_seconds=${IDLE_SECONDS:-30}
measurement_votes=${MEASUREMENT_VOTES:-20}
settle_millis=${SETTLE_MILLIS:-5000}
vote_settle_millis=${VOTE_SETTLE_MILLIS:-1200}
event_timeout_millis=${EVENT_TIMEOUT_MILLIS:-10000}
period_count=$(printf '%s\n' "$periods_ms" | awk -F, '{ print NF }')
settle_budget_seconds=$(printf '%s\n' "$periods_ms" | awk -F, -v configured="$settle_millis" '
  {
    total = 0
    for (i = 1; i <= NF; i++) {
      period_settle = ($i + 0) * 5
      selected = configured > period_settle ? configured : period_settle
      total += int((selected + 999) / 1000)
    }
    print total
  }
')
vote_budget_seconds=$(( (measurement_votes + 3) * (vote_settle_millis + event_timeout_millis + 999) / 1000 ))
max_duration_seconds=$((settle_budget_seconds + period_count * (idle_seconds + vote_budget_seconds) + 120))
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
    sh loadtest/collect_exp06_metrics.sh > "$run_dir/collector.log" 2>&1 &
  collector_pid=$!

  set +e
  SESSION_COOKIE="$session_cookie" RESTAURANT_A="$restaurant_a" RESTAURANT_B="$restaurant_b" \
    OUTPUT_DIR="$run_dir" TARGET_CONNECTIONS="$target_connections" PERIODS_MS="$periods_ms" \
    IDLE_SECONDS="$idle_seconds" MEASUREMENT_VOTES="$measurement_votes" SETTLE_MILLIS="$settle_millis" \
    VOTE_SETTLE_MILLIS="$vote_settle_millis" EVENT_TIMEOUT_MILLIS="$event_timeout_millis" \
    run_node loadtest/exp06_cache_periods.mjs > "$run_dir/client.log" 2>&1
  client_status=$?
  set -e

  cleanup_collector
  if [ "$client_status" -ne 0 ]; then
    printf 'EXP-06 run %s failed; measurement stopped before further runs\n' "$run" >&2
    exit "$client_status"
  fi
  if ! awk -F, 'NR == 1 { columns=NF } NR > 1 && NF != columns { exit 1 } END { if (NR < 2) exit 1 }' "$run_dir/metrics.csv"; then
    printf 'EXP-06 run %s collector output is missing or malformed\n' "$run" >&2
    exit 1
  fi
  run=$((run + 1))
done

python3 -B loadtest/analyze_exp06.py "$results_root"
