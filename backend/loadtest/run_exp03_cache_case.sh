#!/bin/sh

set -eu

run=$1
results_dir=loadtest/results/exp03
label="run-${run}"
mkdir -p "$results_dir"

snapshot() {
  phase=$1
  curl -fsS http://localhost:8080/actuator/prometheus > "$results_dir/${phase}-prometheus.txt"
  date '+%Y-%m-%dT%H:%M:%S%z' > "$results_dir/${phase}-timestamp-kst.txt"
}

snapshot "${label}-before"
date '+%Y-%m-%dT%H:%M:%S%z' > "$results_dir/${label}-started-kst.txt"

K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
K6_PROMETHEUS_RW_TREND_STATS='p(50),p(95),p(99),max' \
K6_PROMETHEUS_RW_STALE_MARKERS=true \
SESSION_MODE=anonymous BASE_URL=http://localhost:8080 INTERVAL=2 \
caffeinate -dimsu k6 run --out experimental-prometheus-rw \
  --tag "testid=exp03-cache-${run}" \
  --summary-export "$results_dir/${label}-summary.json" \
  loadtest/exp02b_poll_jitter.js > "$results_dir/${label}-k6.txt" 2>&1 &
k6_pid=$!

K6_PID="$k6_pid" MAX_DURATION_SECONDS=240 INTERVAL_SECONDS=1 \
PROCESS_SCAN_INTERVAL_SECONDS=5 OUTPUT_FILE="$results_dir/${label}-metrics.csv" \
BUCKET_OUTPUT_FILE="$results_dir/${label}-buckets.csv" \
PROCESS_OUTPUT_FILE="$results_dir/${label}-processes.csv" \
HOST_METRICS_FILE=loadtest/results/host_metrics.prom \
loadtest/collect_metrics.sh > "$results_dir/${label}-collector.log" 2>&1 &
collector_pid=$!

MAX_DURATION_SECONDS=240 INTERVAL_SECONDS=1 \
OUTPUT_FILE="$results_dir/${label}-arrival.csv" \
sh loadtest/collect_arrival_rate.sh > "$results_dir/${label}-arrival.log" 2>&1 &
arrival_pid=$!

MAX_DURATION_SECONDS=240 INTERVAL_SECONDS=1 \
OUTPUT_FILE="$results_dir/${label}-cache.csv" \
sh loadtest/collect_cache_metrics.sh > "$results_dir/${label}-cache.log" 2>&1 &
cache_pid=$!

wait "$k6_pid"
wait "$collector_pid" || true
wait "$arrival_pid" || true
wait "$cache_pid" || true
date '+%Y-%m-%dT%H:%M:%S%z' > "$results_dir/${label}-finished-kst.txt"
snapshot "${label}-after"
