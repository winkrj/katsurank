#!/bin/sh

set -eu

actuator_base_url=${ACTUATOR_BASE_URL:-http://localhost:8080}
output_file=${OUTPUT_FILE:-loadtest/arrival-rate.csv}
interval_seconds=${INTERVAL_SECONDS:-1}
max_duration_seconds=${MAX_DURATION_SECONDS:-0}
snapshot_file=$(mktemp "${TMPDIR:-/tmp}/katsurank-arrival.XXXXXX")
started_epoch=$(date +%s)

cleanup() {
  rm -f "$snapshot_file"
}

trap cleanup EXIT

mkdir -p "$(dirname "$output_file")"
printf '%s\n' 'timestamp_epoch,timestamp_utc,http_ranking_requests_count' > "$output_file"

while :; do
  timestamp_epoch=$(date +%s)
  timestamp_utc=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
  if curl -fsS --connect-timeout 2 --max-time 3 "${actuator_base_url}/actuator/prometheus" -o "$snapshot_file"; then
    count=$(awk '
      function label_value(token, label, marker, rest, end_index) {
        marker = label "=\""
        if (index(token, marker) == 0) return ""
        rest = substr(token, index(token, marker) + length(marker))
        end_index = index(rest, "\"")
        return substr(rest, 1, end_index - 1)
      }
      $1 ~ /^http_server_requests_seconds_count\{/ && label_value($1, "uri") == "/api/v1/ranking" { total += $NF }
      END { printf "%.17g", total }
    ' "$snapshot_file")
  else
    count=''
  fi
  printf '%s,%s,%s\n' "$timestamp_epoch" "$timestamp_utc" "$count" >> "$output_file"

  if [ "$max_duration_seconds" -gt 0 ] && [ $((timestamp_epoch - started_epoch)) -ge "$max_duration_seconds" ]; then
    break
  fi
  sleep "$interval_seconds"
done
