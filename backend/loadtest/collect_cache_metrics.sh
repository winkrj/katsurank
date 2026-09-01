#!/bin/sh

set -eu

actuator_base_url=${ACTUATOR_BASE_URL:-http://localhost:8080}
output_file=${OUTPUT_FILE:-loadtest/cache_metrics.csv}
interval_seconds=${INTERVAL_SECONDS:-1}
max_duration_seconds=${MAX_DURATION_SECONDS:-0}
started_epoch=$(date +%s)
snapshot_file=$(mktemp "${TMPDIR:-/tmp}/katsurank-cache-metrics.XXXXXX")

cleanup() {
  rm -f "$snapshot_file"
}

trap cleanup EXIT
trap 'exit 0' INT TERM

mkdir -p "$(dirname "$output_file")"
printf '%s\n' 'timestamp_epoch,timestamp_utc,scrape_ok,cache_hits,miss_range_outside,miss_cache_empty,miss_refresh_failure_fallback,refresh_duration_count,refresh_duration_sum_seconds,refresh_failures,refresh_interval_count,refresh_interval_sum_seconds' > "$output_file"

metric_value() {
  metric=$1
  label=$2
  awk -v metric="$metric" -v label="$label" '
    $0 !~ /^#/ && $1 ~ ("^" metric "(\\{| )") {
      if (label == "" || index($1, label) > 0) value += $NF
    }
    END { if (value != "") printf "%.17g", value }
  ' "$snapshot_file"
}

while :; do
  epoch=$(date +%s)
  utc=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
  if curl -fsS --connect-timeout 2 --max-time 5 "$actuator_base_url/actuator/prometheus" -o "$snapshot_file"; then
    hits=$(metric_value ranking_cache_hits_total '')
    range=$(metric_value ranking_cache_misses_total 'reason="range_outside"')
    empty=$(metric_value ranking_cache_misses_total 'reason="cache_empty"')
    refresh_fallback=$(metric_value ranking_cache_misses_total 'reason="refresh_failure_fallback"')
    duration_count=$(metric_value ranking_cache_refresh_duration_seconds_count '')
    duration_sum=$(metric_value ranking_cache_refresh_duration_seconds_sum '')
    failures=$(metric_value ranking_cache_refresh_failures_total '')
    interval_count=$(metric_value ranking_cache_refresh_interval_seconds_count '')
    interval_sum=$(metric_value ranking_cache_refresh_interval_seconds_sum '')
    printf '%s,%s,1,%s,%s,%s,%s,%s,%s,%s,%s,%s\n' "$epoch" "$utc" "$hits" "$range" "$empty" "$refresh_fallback" "$duration_count" "$duration_sum" "$failures" "$interval_count" "$interval_sum" >> "$output_file"
  else
    printf '%s,%s,0,,,,,,,,,,\n' "$epoch" "$utc" >> "$output_file"
  fi

  if [ "$max_duration_seconds" -gt 0 ] && [ $(( $(date +%s) - started_epoch )) -ge "$max_duration_seconds" ]; then
    break
  fi
  sleep "$interval_seconds"
done
