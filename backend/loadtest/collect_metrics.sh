#!/bin/sh

set -eu

actuator_base_url=${ACTUATOR_BASE_URL:-http://localhost:8080}
output_file=${OUTPUT_FILE:-loadtest/metrics.csv}
interval_seconds=${INTERVAL_SECONDS:-1}
max_samples=${MAX_SAMPLES:-0}
k6_pid=${K6_PID:-}
bucket_file="${output_file%.csv}_buckets.csv"
snapshot_file=$(mktemp "${TMPDIR:-/tmp}/katsurank-prometheus.XXXXXX")
sample_count=0

cleanup() {
  rm -f "$snapshot_file"
}

stop_collector() {
  exit 0
}

trap cleanup EXIT
trap stop_collector INT TERM

mkdir -p "$(dirname "$output_file")"

printf '%s\n' 'timestamp_epoch,timestamp_utc,scrape_ok,hikari_acquire_count,hikari_acquire_sum_seconds,hikari_acquire_max_seconds,hikari_acquire_p95_cumulative_seconds,hikari_usage_count,hikari_usage_sum_seconds,hikari_usage_max_seconds,hikari_usage_p95_cumulative_seconds,hikari_active,hikari_pending,jvm_memory_used_bytes,process_cpu_usage,system_cpu_usage,jdbc_active,jdbc_idle,jdbc_max,jdbc_min,http_requests_count,http_requests_sum_seconds,http_requests_max_seconds,k6_cpu_percent,k6_rss_kib' > "$output_file"
printf '%s\n' 'timestamp_epoch,timestamp_utc,metric,le,cumulative_count' > "$bucket_file"

while :; do
  timestamp_epoch=$(date +%s)
  timestamp_utc=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

  if curl -fsS --connect-timeout 2 --max-time 5 "${actuator_base_url}/actuator/prometheus" -o "$snapshot_file"; then
    scrape_ok=1
    metric_values=$(awk '
      function metric_name(token, parts) {
        split(token, parts, "{")
        return parts[1]
      }
      function label_value(token, label, marker, rest, end_index) {
        marker = label "=\""
        rest = substr(token, index(token, marker) + length(marker))
        end_index = index(rest, "\"")
        return substr(rest, 1, end_index - 1)
      }
      function cell(seen, value) {
        return seen ? sprintf("%.17g", value) : ""
      }
      $0 !~ /^#/ {
        name = metric_name($1)
        value = $NF + 0
        if (name == "hikaricp_connections_acquire_seconds_count") { acq_count += value; acq_count_seen = 1 }
        else if (name == "hikaricp_connections_acquire_seconds_sum") { acq_sum += value; acq_sum_seen = 1 }
        else if (name == "hikaricp_connections_acquire_seconds_max") { acq_max += value; acq_max_seen = 1 }
        else if (name == "hikaricp_connections_acquire_seconds_bucket") {
          le = label_value($1, "le")
          acq_bucket[le] += value
          if (le == "+Inf") { acq_inf += value }
        }
        else if (name == "hikaricp_connections_usage_seconds_count") { usage_count += value; usage_count_seen = 1 }
        else if (name == "hikaricp_connections_usage_seconds_sum") { usage_sum += value; usage_sum_seen = 1 }
        else if (name == "hikaricp_connections_usage_seconds_max") { usage_max += value; usage_max_seen = 1 }
        else if (name == "hikaricp_connections_usage_seconds_bucket") {
          le = label_value($1, "le")
          usage_bucket[le] += value
          if (le == "+Inf") { usage_inf += value }
        }
        else if (name == "hikaricp_connections_active") { hikari_active += value; hikari_active_seen = 1 }
        else if (name == "hikaricp_connections_pending") { hikari_pending += value; hikari_pending_seen = 1 }
        else if (name == "jvm_memory_used_bytes") { jvm_memory += value; jvm_memory_seen = 1 }
        else if (name == "process_cpu_usage") { process_cpu += value; process_cpu_seen = 1 }
        else if (name == "system_cpu_usage") { system_cpu += value; system_cpu_seen = 1 }
        else if (name == "jdbc_connections_active") { jdbc_active += value; jdbc_active_seen = 1 }
        else if (name == "jdbc_connections_idle") { jdbc_idle += value; jdbc_idle_seen = 1 }
        else if (name == "jdbc_connections_max") { jdbc_max += value; jdbc_max_seen = 1 }
        else if (name == "jdbc_connections_min") { jdbc_min += value; jdbc_min_seen = 1 }
        else if (name == "http_server_requests_seconds_count") { http_count += value; http_count_seen = 1 }
        else if (name == "http_server_requests_seconds_sum") { http_sum += value; http_sum_seen = 1 }
        else if (name == "http_server_requests_seconds_max") { http_max += value; http_max_seen = 1 }
      }
      END {
        acq_p95 = ""
        if (acq_inf > 0) {
          target = acq_inf * 0.95
          minimum = 1e300
          acq_p95 = "+Inf"
          for (le in acq_bucket) {
            if (le != "+Inf" && acq_bucket[le] >= target && (le + 0) < minimum) {
              minimum = le + 0
              acq_p95 = le
            }
          }
        }
        usage_p95 = ""
        if (usage_inf > 0) {
          target = usage_inf * 0.95
          minimum = 1e300
          usage_p95 = "+Inf"
          for (le in usage_bucket) {
            if (le != "+Inf" && usage_bucket[le] >= target && (le + 0) < minimum) {
              minimum = le + 0
              usage_p95 = le
            }
          }
        }
        printf "%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s", \
          cell(acq_count_seen, acq_count), cell(acq_sum_seen, acq_sum), cell(acq_max_seen, acq_max), acq_p95, \
          cell(usage_count_seen, usage_count), cell(usage_sum_seen, usage_sum), cell(usage_max_seen, usage_max), usage_p95, \
          cell(hikari_active_seen, hikari_active), cell(hikari_pending_seen, hikari_pending), \
          cell(jvm_memory_seen, jvm_memory), cell(process_cpu_seen, process_cpu), cell(system_cpu_seen, system_cpu), \
          cell(jdbc_active_seen, jdbc_active), cell(jdbc_idle_seen, jdbc_idle), cell(jdbc_max_seen, jdbc_max), cell(jdbc_min_seen, jdbc_min), \
          cell(http_count_seen, http_count), cell(http_sum_seen, http_sum), cell(http_max_seen, http_max)
      }
    ' "$snapshot_file")

    awk -v epoch="$timestamp_epoch" -v utc="$timestamp_utc" '
      function metric_name(token, parts) {
        split(token, parts, "{")
        return parts[1]
      }
      function label_value(token, label, marker, rest, end_index) {
        marker = label "=\""
        rest = substr(token, index(token, marker) + length(marker))
        end_index = index(rest, "\"")
        return substr(rest, 1, end_index - 1)
      }
      $0 !~ /^#/ {
        name = metric_name($1)
        if (name == "hikaricp_connections_acquire_seconds_bucket" ||
            name == "hikaricp_connections_usage_seconds_bucket" ||
            name == "http_server_requests_seconds_bucket") {
          le = label_value($1, "le")
          key = name SUBSEP le
          bucket[key] += $NF + 0
        }
      }
      END {
        for (key in bucket) {
          split(key, parts, SUBSEP)
          printf "%s,%s,%s,%s,%.17g\n", epoch, utc, parts[1], parts[2], bucket[key]
        }
      }
    ' "$snapshot_file" >> "$bucket_file"
  else
    scrape_ok=0
    metric_values=',,,,,,,,,,,,,,,,,,,'
  fi

  k6_cpu=''
  k6_rss=''
  if [ -n "$k6_pid" ]; then
    process_values=$(ps -p "$k6_pid" -o %cpu= -o rss= 2>/dev/null || true)
    if [ -n "$process_values" ]; then
      k6_cpu=$(printf '%s\n' "$process_values" | awk '{print $1}')
      k6_rss=$(printf '%s\n' "$process_values" | awk '{print $2}')
    fi
  fi

  printf '%s,%s,%s,%s,%s,%s\n' "$timestamp_epoch" "$timestamp_utc" "$scrape_ok" "$metric_values" "$k6_cpu" "$k6_rss" >> "$output_file"

  sample_count=$((sample_count + 1))
  if [ "$max_samples" -gt 0 ] && [ "$sample_count" -ge "$max_samples" ]; then
    break
  fi
  sleep "$interval_seconds"
done
