#!/bin/sh
set -eu
run=$1; root=loadtest/results/exp04; label="run-$run"; mkdir -p "$root"
snapshot() { curl -fsS http://localhost:8080/actuator/prometheus > "$root/$1-prometheus.txt"; date '+%Y-%m-%dT%H:%M:%S%z' > "$root/$1-timestamp-kst.txt"; }
snapshot "$label-before"; date '+%Y-%m-%dT%H:%M:%S%z' > "$root/$label-started-kst.txt"
K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write K6_PROMETHEUS_RW_TREND_STATS='p(50),p(95),p(99),max' K6_PROMETHEUS_RW_STALE_MARKERS=true SESSION_MODE=anonymous caffeinate -dimsu k6 run --out experimental-prometheus-rw --tag "testid=exp04-$run" --summary-export "$root/$label-summary.json" loadtest/exp04_rps_knee.js > "$root/$label-k6.txt" 2>&1 & k6=$!
K6_PID=$k6 MAX_DURATION_SECONDS=420 INTERVAL_SECONDS=1 OUTPUT_FILE="$root/$label-metrics.csv" BUCKET_OUTPUT_FILE="$root/$label-buckets.csv" PROCESS_OUTPUT_FILE="$root/$label-processes.csv" HOST_METRICS_FILE=loadtest/results/host_metrics.prom loadtest/collect_metrics.sh > "$root/$label-collector.log" 2>&1 & metrics=$!
MAX_DURATION_SECONDS=420 OUTPUT_FILE="$root/$label-arrival.csv" sh loadtest/collect_arrival_rate.sh > "$root/$label-arrival.log" 2>&1 & arrival=$!
MAX_DURATION_SECONDS=420 OUTPUT_FILE="$root/$label-network.csv" sh loadtest/collect_network_bytes.sh > "$root/$label-network.log" 2>&1 & network=$!
wait "$k6"; wait "$metrics" || true; wait "$arrival" || true; wait "$network" || true
date '+%Y-%m-%dT%H:%M:%S%z' > "$root/$label-finished-kst.txt"; snapshot "$label-after"
