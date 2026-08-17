#!/bin/sh

set -eu

app_pid=${APP_PID:?APP_PID is required}
session_cookie=${SESSION_COOKIE:?SESSION_COOKIE is required}
restaurant_a=${RESTAURANT_A:?RESTAURANT_A is required}
restaurant_b=${RESTAURANT_B:?RESTAURANT_B is required}
results_root=${RESULTS_ROOT:-loadtest/results/exp06}
runs=${RUNS:-3}

mkdir -p "$results_root"

run=1
while [ "$run" -le "$runs" ]; do
  run_dir="$results_root/run-$run"
  mkdir -p "$run_dir"
  APP_PID="$app_pid" OUTPUT_FILE="$run_dir/metrics.csv" MAX_DURATION_SECONDS=900 \
    sh loadtest/collect_exp06_metrics.sh > "$run_dir/collector.log" 2>&1 &
  collector_pid=$!

  set +e
  SESSION_COOKIE="$session_cookie" RESTAURANT_A="$restaurant_a" RESTAURANT_B="$restaurant_b" \
    OUTPUT_DIR="$run_dir" TARGET_CONNECTIONS="${TARGET_CONNECTIONS:-1000}" \
    PERIODS_MS="${PERIODS_MS:-1000,500,200,100}" IDLE_SECONDS="${IDLE_SECONDS:-30}" \
    MEASUREMENT_VOTES="${MEASUREMENT_VOTES:-20}" SETTLE_MILLIS="${SETTLE_MILLIS:-5000}" \
    caffeinate -dimsu node loadtest/exp06_cache_periods.mjs > "$run_dir/client.log" 2>&1
  client_status=$?
  set -e

  kill "$collector_pid" 2>/dev/null || true
  wait "$collector_pid" 2>/dev/null || true
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

python3 loadtest/analyze_exp06.py "$results_root"
