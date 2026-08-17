#!/bin/sh

set -eu

app_pid=${APP_PID:?APP_PID is required}
session_cookie=${SESSION_COOKIE:?SESSION_COOKIE is required}
restaurant_a=${RESTAURANT_A:?RESTAURANT_A is required}
restaurant_b=${RESTAURANT_B:?RESTAURANT_B is required}
results_root=${RESULTS_ROOT:-loadtest/results/exp05}
runs=${RUNS:-3}

mkdir -p "$results_root"

run=1
while [ "$run" -le "$runs" ]; do
  run_dir="$results_root/run-$run"
  mkdir -p "$run_dir"
  APP_PID="$app_pid" OUTPUT_FILE="$run_dir/metrics.csv" MAX_DURATION_SECONDS=900 \
    sh loadtest/collect_exp05_metrics.sh > "$run_dir/collector.log" 2>&1 &
  collector_pid=$!

  set +e
  APP_PID="$app_pid" SESSION_COOKIE="$session_cookie" RESTAURANT_A="$restaurant_a" RESTAURANT_B="$restaurant_b" \
    OUTPUT_DIR="$run_dir" BASELINE_SECONDS="${BASELINE_SECONDS:-30}" HOLD_SECONDS="${HOLD_SECONDS:-120}" \
    CLEANUP_SECONDS="${CLEANUP_SECONDS:-30}" MEASUREMENT_VOTES="${MEASUREMENT_VOTES:-20}" \
    caffeinate -dimsu node loadtest/exp05_sse_clients.mjs > "$run_dir/client.log" 2>&1
  client_status=$?
  set -e

  kill "$collector_pid" 2>/dev/null || true
  wait "$collector_pid" 2>/dev/null || true
  if [ "$client_status" -ne 0 ]; then
    printf 'EXP-05 run %s failed; measurement stopped before further runs\n' "$run" >&2
    exit "$client_status"
  fi
  run=$((run + 1))
done

python3 loadtest/analyze_exp05.py "$results_root"
