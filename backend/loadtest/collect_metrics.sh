#!/bin/sh

set -eu

actuator_base_url=${ACTUATOR_BASE_URL:-http://localhost:8080}
output_file=${OUTPUT_FILE:-loadtest/metrics.csv}
interval_seconds=${INTERVAL_SECONDS:-1}
process_scan_interval_seconds=${PROCESS_SCAN_INTERVAL_SECONDS:-5}
max_samples=${MAX_SAMPLES:-0}
max_duration_seconds=${MAX_DURATION_SECONDS:-0}
k6_pid=${K6_PID:-}
prometheus_container=${PROMETHEUS_CONTAINER:-katsurank-prometheus}
grafana_container=${GRAFANA_CONTAINER:-katsurank-grafana}
host_metrics_file=${HOST_METRICS_FILE:-loadtest/results/host_metrics.prom}
machine_cpu_count=${MACHINE_CPU_COUNT:-$(sysctl -n hw.ncpu 2>/dev/null || getconf _NPROCESSORS_ONLN)}
bucket_file=${BUCKET_OUTPUT_FILE:-"${output_file%.csv}_buckets.csv"}
process_file=${PROCESS_OUTPUT_FILE:-"${output_file%.csv}_processes.csv"}
snapshot_file=$(mktemp "${TMPDIR:-/tmp}/katsurank-prometheus.XXXXXX")
process_snapshot_file=$(mktemp "${TMPDIR:-/tmp}/katsurank-processes.XXXXXX")
top_process_file=$(mktemp "${TMPDIR:-/tmp}/katsurank-top-processes.XXXXXX")
top_snapshot_file=$(mktemp "${TMPDIR:-/tmp}/katsurank-top.XXXXXX")
sample_count=0
collector_started_epoch=$(date +%s)
last_process_scan_epoch=0
last_process_scan_timestamp=''
last_top8_cpu_pct_of_machine=''
last_host_system_cpu_pct_of_machine=''
last_unaccounted_cpu_pct_of_machine=''
prometheus_cpu_raw=''
prometheus_cpu_machine=''
prometheus_memory_bytes=''
grafana_cpu_raw=''
grafana_cpu_machine=''
grafana_memory_bytes=''

memory_to_bytes() {
  awk -v value="$1" 'BEGIN {
    number = value + 0
    if (value ~ /GiB$/) multiplier = 1073741824
    else if (value ~ /MiB$/) multiplier = 1048576
    else if (value ~ /KiB$/) multiplier = 1024
    else if (value ~ /GB$/) multiplier = 1000000000
    else if (value ~ /MB$/) multiplier = 1000000
    else if (value ~ /kB$/) multiplier = 1000
    else multiplier = 1
    printf "%.0f", number * multiplier
  }'
}

cleanup() {
  rm -f "$snapshot_file" "$process_snapshot_file" "$top_process_file" "$top_snapshot_file"
}

stop_collector() {
  exit 0
}

trap cleanup EXIT
trap stop_collector INT TERM

case "$machine_cpu_count" in
  ''|*[!0-9]*) printf 'MACHINE_CPU_COUNT must be a positive integer\n' >&2; exit 2 ;;
  0) printf 'MACHINE_CPU_COUNT must be greater than zero\n' >&2; exit 2 ;;
esac

mkdir -p "$(dirname "$output_file")" "$(dirname "$bucket_file")" "$(dirname "$process_file")"
mkdir -p "$(dirname "$host_metrics_file")"

printf '%s\n' 'timestamp_epoch,timestamp_utc,scrape_ok,machine_cpu_count,hikari_acquire_count,hikari_acquire_sum_seconds,hikari_acquire_max_seconds,hikari_acquire_p95_cumulative_seconds,hikari_usage_count,hikari_usage_sum_seconds,hikari_usage_max_seconds,hikari_usage_p95_cumulative_seconds,hikari_active,hikari_pending,jvm_memory_used_bytes,process_cpu_ratio_raw,process_cpu_pct_of_machine,system_cpu_ratio_raw,system_cpu_pct_of_machine,jdbc_active,jdbc_idle,jdbc_max,jdbc_min,http_requests_count,http_requests_sum_seconds,http_requests_max_seconds,jvm_gc_pause_count,jvm_gc_pause_sum_seconds,jvm_gc_pause_max_seconds,k6_cpu_pct_core_raw,k6_cpu_pct_of_machine,k6_rss_kib,collector_cpu_pct_core_raw,collector_cpu_pct_of_machine,collector_rss_kib,prometheus_cpu_pct_core_raw,prometheus_cpu_pct_of_machine,prometheus_memory_bytes,grafana_cpu_pct_core_raw,grafana_cpu_pct_of_machine,grafana_memory_bytes,process_scan_epoch,host_system_cpu_pct_of_machine,top8_cpu_pct_of_machine,unaccounted_cpu_pct_of_machine' > "$output_file"
printf '%s\n' 'timestamp_epoch,timestamp_utc,metric,le,cumulative_count' > "$bucket_file"
printf '%s\n' 'timestamp_epoch,timestamp_utc,scan_kind,rank,pid,process_name,cpu_pct_core_raw,cpu_pct_of_machine,rss_kib' > "$process_file"

while :; do
  timestamp_epoch=$(date +%s)
  timestamp_utc=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

  if curl -fsS --connect-timeout 2 --max-time 5 "${actuator_base_url}/actuator/prometheus" -o "$snapshot_file"; then
    scrape_ok=1
    metric_values=$(awk '
      function metric_name(token, parts) { split(token, parts, "{"); return parts[1] }
      function label_value(token, label, marker, rest, end_index) {
        marker = label "=\""
        if (index(token, marker) == 0) return ""
        rest = substr(token, index(token, marker) + length(marker))
        end_index = index(rest, "\"")
        return substr(rest, 1, end_index - 1)
      }
      function cell(seen, value) { return seen ? sprintf("%.17g", value) : "" }
      $0 !~ /^#/ {
        name = metric_name($1); value = $NF + 0
        if (name == "hikaricp_connections_acquire_seconds_count") { acq_count += value; acq_count_seen = 1 }
        else if (name == "hikaricp_connections_acquire_seconds_sum") { acq_sum += value; acq_sum_seen = 1 }
        else if (name == "hikaricp_connections_acquire_seconds_max") { acq_max += value; acq_max_seen = 1 }
        else if (name == "hikaricp_connections_acquire_seconds_bucket") { le = label_value($1, "le"); acq_bucket[le] += value; if (le == "+Inf") acq_inf += value }
        else if (name == "hikaricp_connections_usage_seconds_count") { usage_count += value; usage_count_seen = 1 }
        else if (name == "hikaricp_connections_usage_seconds_sum") { usage_sum += value; usage_sum_seen = 1 }
        else if (name == "hikaricp_connections_usage_seconds_max") { usage_max += value; usage_max_seen = 1 }
        else if (name == "hikaricp_connections_usage_seconds_bucket") { le = label_value($1, "le"); usage_bucket[le] += value; if (le == "+Inf") usage_inf += value }
        else if (name == "hikaricp_connections_active") { hikari_active += value; hikari_active_seen = 1 }
        else if (name == "hikaricp_connections_pending") { hikari_pending += value; hikari_pending_seen = 1 }
        else if (name == "jvm_memory_used_bytes") { jvm_memory += value; jvm_memory_seen = 1 }
        else if (name == "process_cpu_usage") { process_cpu += value; process_cpu_seen = 1 }
        else if (name == "system_cpu_usage") { system_cpu += value; system_cpu_seen = 1 }
        else if (name == "jdbc_connections_active") { jdbc_active += value; jdbc_active_seen = 1 }
        else if (name == "jdbc_connections_idle") { jdbc_idle += value; jdbc_idle_seen = 1 }
        else if (name == "jdbc_connections_max") { jdbc_max += value; jdbc_max_seen = 1 }
        else if (name == "jdbc_connections_min") { jdbc_min += value; jdbc_min_seen = 1 }
        else if (name == "http_server_requests_seconds_count" && label_value($1, "uri") == "/api/v1/ranking") { http_count += value; http_count_seen = 1 }
        else if (name == "http_server_requests_seconds_sum" && label_value($1, "uri") == "/api/v1/ranking") { http_sum += value; http_sum_seen = 1 }
        else if (name == "http_server_requests_seconds_max" && label_value($1, "uri") == "/api/v1/ranking") { http_max += value; http_max_seen = 1 }
        else if (name == "jvm_gc_pause_seconds_count") { gc_count += value; gc_count_seen = 1 }
        else if (name == "jvm_gc_pause_seconds_sum") { gc_sum += value; gc_sum_seen = 1 }
        else if (name == "jvm_gc_pause_seconds_max") { if (!gc_max_seen || value > gc_max) gc_max = value; gc_max_seen = 1 }
      }
      END {
        acq_p95 = ""; if (acq_inf > 0) { target = acq_inf * 0.95; minimum = 1e300; acq_p95 = "+Inf"; for (le in acq_bucket) if (le != "+Inf" && acq_bucket[le] >= target && le + 0 < minimum) { minimum = le + 0; acq_p95 = le } }
        usage_p95 = ""; if (usage_inf > 0) { target = usage_inf * 0.95; minimum = 1e300; usage_p95 = "+Inf"; for (le in usage_bucket) if (le != "+Inf" && usage_bucket[le] >= target && le + 0 < minimum) { minimum = le + 0; usage_p95 = le } }
        printf "%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s", \
          cell(acq_count_seen, acq_count), cell(acq_sum_seen, acq_sum), cell(acq_max_seen, acq_max), acq_p95, \
          cell(usage_count_seen, usage_count), cell(usage_sum_seen, usage_sum), cell(usage_max_seen, usage_max), usage_p95, \
          cell(hikari_active_seen, hikari_active), cell(hikari_pending_seen, hikari_pending), cell(jvm_memory_seen, jvm_memory), \
          cell(process_cpu_seen, process_cpu), cell(system_cpu_seen, system_cpu), \
          cell(jdbc_active_seen, jdbc_active), cell(jdbc_idle_seen, jdbc_idle), cell(jdbc_max_seen, jdbc_max), cell(jdbc_min_seen, jdbc_min), \
          cell(http_count_seen, http_count), cell(http_sum_seen, http_sum), cell(http_max_seen, http_max), \
          cell(gc_count_seen, gc_count), cell(gc_sum_seen, gc_sum), cell(gc_max_seen, gc_max)
      }
    ' "$snapshot_file")

    process_cpu_ratio_raw=$(printf '%s\n' "$metric_values" | awk -F, '{print $12}')
    system_cpu_ratio_raw=$(printf '%s\n' "$metric_values" | awk -F, '{print $13}')
    process_cpu_pct_of_machine=$(awk -v value="$process_cpu_ratio_raw" 'BEGIN { if (value != "") printf "%.6f", value * 100 }')
    system_cpu_pct_of_machine=$(awk -v value="$system_cpu_ratio_raw" 'BEGIN { if (value != "") printf "%.6f", value * 100 }')
    metric_values=$(printf '%s\n' "$metric_values" | awk -F, -v OFS=, -v process_pct="$process_cpu_pct_of_machine" -v system_pct="$system_cpu_pct_of_machine" '{ for (i=1;i<=12;i++) printf "%s%s", $i, OFS; printf "%s%s%s%s", process_pct, OFS, $13, OFS system_pct; for (i=14;i<=NF;i++) printf "%s%s", OFS, $i }')

    awk -v epoch="$timestamp_epoch" -v utc="$timestamp_utc" '
      function metric_name(token, parts) { split(token, parts, "{"); return parts[1] }
      function label_value(token, label, marker, rest, end_index) { marker = label "=\""; if (index(token, marker) == 0) return ""; rest = substr(token, index(token, marker) + length(marker)); end_index = index(rest, "\""); return substr(rest, 1, end_index - 1) }
      $0 !~ /^#/ {
        name = metric_name($1)
        if (name == "hikaricp_connections_acquire_seconds_bucket" || name == "hikaricp_connections_usage_seconds_bucket" || (name == "http_server_requests_seconds_bucket" && label_value($1, "uri") == "/api/v1/ranking") || name == "jvm_gc_pause_seconds_bucket") {
          le = label_value($1, "le"); key = name SUBSEP le; bucket[key] += $NF + 0
        }
      }
      END { for (key in bucket) { split(key, parts, SUBSEP); printf "%s,%s,%s,%s,%.17g\n", epoch, utc, parts[1], parts[2], bucket[key] } }
    ' "$snapshot_file" >> "$bucket_file"
  else
    scrape_ok=0
    metric_values=',,,,,,,,,,,,,,,,,,,,,,,,,,'
    system_cpu_pct_of_machine=''
  fi

  k6_cpu_raw=''; k6_cpu_machine=''; k6_rss=''
  if [ -n "$k6_pid" ]; then
    process_values=$(ps -p "$k6_pid" -o %cpu= -o rss= 2>/dev/null || true)
    if [ -n "$process_values" ]; then
      k6_cpu_raw=$(printf '%s\n' "$process_values" | awk '{print $1}')
      k6_cpu_machine=$(awk -v raw="$k6_cpu_raw" -v cores="$machine_cpu_count" 'BEGIN { printf "%.6f", raw / cores }')
      k6_rss=$(printf '%s\n' "$process_values" | awk '{print $2}')
    fi
  fi

  collector_values=$(ps -p "$$" -o %cpu= -o rss= 2>/dev/null || true)
  collector_cpu_raw=$(printf '%s\n' "$collector_values" | awk '{print $1}')
  collector_rss=$(printf '%s\n' "$collector_values" | awk '{print $2}')
  collector_cpu_machine=$(awk -v raw="$collector_cpu_raw" -v cores="$machine_cpu_count" 'BEGIN { if (raw != "") printf "%.6f", raw / cores }')

  if [ $((timestamp_epoch - last_process_scan_epoch)) -ge "$process_scan_interval_seconds" ]; then
    container_values=$(docker stats --no-stream --format '{{.Name}},{{.CPUPerc}},{{.MemUsage}}' "$prometheus_container" "$grafana_container" 2>/dev/null || true)
    prometheus_values=$(printf '%s\n' "$container_values" | awk -F, -v name="$prometheus_container" '$1 == name {print; exit}')
    grafana_values=$(printf '%s\n' "$container_values" | awk -F, -v name="$grafana_container" '$1 == name {print; exit}')
    prometheus_cpu_raw=$(printf '%s\n' "$prometheus_values" | awk -F, '{gsub(/%/, "", $2); print $2}')
    prometheus_cpu_machine=$(awk -v raw="$prometheus_cpu_raw" -v cores="$machine_cpu_count" 'BEGIN {if (raw != "") printf "%.6f", raw / cores}')
    prometheus_memory_value=$(printf '%s\n' "$prometheus_values" | awk -F, '{split($3, parts, " /"); print parts[1]}')
    prometheus_memory_bytes=''
    if [ -n "$prometheus_memory_value" ]; then prometheus_memory_bytes=$(memory_to_bytes "$prometheus_memory_value"); fi
    grafana_cpu_raw=$(printf '%s\n' "$grafana_values" | awk -F, '{gsub(/%/, "", $2); print $2}')
    grafana_cpu_machine=$(awk -v raw="$grafana_cpu_raw" -v cores="$machine_cpu_count" 'BEGIN {if (raw != "") printf "%.6f", raw / cores}')
    grafana_memory_value=$(printf '%s\n' "$grafana_values" | awk -F, '{split($3, parts, " /"); print parts[1]}')
    grafana_memory_bytes=''
    if [ -n "$grafana_memory_value" ]; then grafana_memory_bytes=$(memory_to_bytes "$grafana_memory_value"); fi

    ps -axo pid=,%cpu=,rss=,comm= > "$process_snapshot_file"
    top -l 2 -n 8 -o cpu -stats pid,cpu > "$top_snapshot_file"
    last_host_system_cpu_pct_of_machine=$(awk '/^CPU usage:/ { idle=$7; sub(/%/, "", idle); value=100-idle } END { printf "%.6f", value }' "$top_snapshot_file")
    awk '/^PID/ { sample++; next } sample == 2 && $1 ~ /^[0-9]+$/ { cpu=$2; sub(/%/, "", cpu); printf "%s\t%s\n", cpu, $1 }' "$top_snapshot_file" > "$top_process_file"
    last_top8_cpu_pct_of_machine=$(awk -F '\t' -v cores="$machine_cpu_count" '{sum += $1} END {printf "%.6f", sum / cores}' "$top_process_file")
    last_unaccounted_cpu_pct_of_machine=$(awk -v system_pct="$last_host_system_cpu_pct_of_machine" -v top8_pct="$last_top8_cpu_pct_of_machine" 'BEGIN {printf "%.6f", system_pct - top8_pct}')
    rank=0
    while IFS="$(printf '\t')" read -r cpu_raw pid; do
      rank=$((rank + 1))
      process_values=$(awk -v target="$pid" '$1 == target { rss=$3; $1=$2=$3=""; sub(/^ +/, ""); print rss "\t" $0; exit }' "$process_snapshot_file")
      rss=$(printf '%s\n' "$process_values" | awk -F '\t' '{print $1}')
      process_name=$(printf '%s\n' "$process_values" | awk -F '\t' '{print $2}')
      if [ -z "$process_name" ]; then process_name='[exited before process metadata lookup]'; fi
      cpu_machine=$(awk -v raw="$cpu_raw" -v cores="$machine_cpu_count" 'BEGIN {printf "%.6f", raw / cores}')
      escaped_name=$(printf '%s' "$process_name" | sed 's/"/""/g')
      printf '%s,%s,top8,%s,%s,"%s",%s,%s,%s\n' "$timestamp_epoch" "$timestamp_utc" "$rank" "$pid" "$escaped_name" "$cpu_raw" "$cpu_machine" "$rss" >> "$process_file"
    done < "$top_process_file"
    awk 'BEGIN {IGNORECASE=1} /com\.docker|qemu|virtiofsd|Virtualization\.VirtualMachine|Docker Desktop/ {print}' "$process_snapshot_file" | while read -r pid cpu_raw rss process_name; do
      if ! awk -F '\t' -v target="$pid" '$2 == target {found=1} END {exit !found}' "$top_process_file"; then
        cpu_machine=$(awk -v raw="$cpu_raw" -v cores="$machine_cpu_count" 'BEGIN {printf "%.6f", raw / cores}')
        escaped_name=$(printf '%s' "$process_name" | sed 's/"/""/g')
        printf '%s,%s,vm_extra_ps,0,%s,"%s",%s,%s,%s\n' "$timestamp_epoch" "$timestamp_utc" "$pid" "$escaped_name" "$cpu_raw" "$cpu_machine" "$rss" >> "$process_file"
      fi
    done
    last_process_scan_epoch=$timestamp_epoch
    last_process_scan_timestamp=$timestamp_epoch

    host_metrics_tmp="${host_metrics_file}.tmp.$$"
    {
      printf '# TYPE katsurank_host_system_cpu_pct_of_machine gauge\n'
      printf 'katsurank_host_system_cpu_pct_of_machine %s\n' "$last_host_system_cpu_pct_of_machine"
      printf '# TYPE katsurank_host_top8_cpu_pct_of_machine gauge\n'
      printf 'katsurank_host_top8_cpu_pct_of_machine %s\n' "$last_top8_cpu_pct_of_machine"
      printf '# TYPE katsurank_host_unaccounted_cpu_pct_of_machine gauge\n'
      printf 'katsurank_host_unaccounted_cpu_pct_of_machine %s\n' "$last_unaccounted_cpu_pct_of_machine"
      if [ -n "$k6_cpu_machine" ]; then printf 'katsurank_host_k6_cpu_pct_of_machine %s\n' "$k6_cpu_machine"; fi
      if [ -n "$prometheus_cpu_machine" ]; then printf 'katsurank_observability_container_cpu_pct_of_machine{container="prometheus"} %s\n' "$prometheus_cpu_machine"; fi
      if [ -n "$grafana_cpu_machine" ]; then printf 'katsurank_observability_container_cpu_pct_of_machine{container="grafana"} %s\n' "$grafana_cpu_machine"; fi
      if [ -n "$prometheus_memory_bytes" ]; then printf 'katsurank_observability_container_memory_bytes{container="prometheus"} %s\n' "$prometheus_memory_bytes"; fi
      if [ -n "$grafana_memory_bytes" ]; then printf 'katsurank_observability_container_memory_bytes{container="grafana"} %s\n' "$grafana_memory_bytes"; fi
    } > "$host_metrics_tmp"
    mv "$host_metrics_tmp" "$host_metrics_file"
  fi

  printf '%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n' "$timestamp_epoch" "$timestamp_utc" "$scrape_ok" "$machine_cpu_count" "$metric_values" "$k6_cpu_raw" "$k6_cpu_machine" "$k6_rss" "$collector_cpu_raw" "$collector_cpu_machine" "$collector_rss" "$prometheus_cpu_raw" "$prometheus_cpu_machine" "$prometheus_memory_bytes" "$grafana_cpu_raw" "$grafana_cpu_machine" "$grafana_memory_bytes" "$last_process_scan_timestamp" "$last_host_system_cpu_pct_of_machine" "$last_top8_cpu_pct_of_machine" "$last_unaccounted_cpu_pct_of_machine" >> "$output_file"

  sample_count=$((sample_count + 1))
  if [ "$max_samples" -gt 0 ] && [ "$sample_count" -ge "$max_samples" ]; then break; fi
  if [ "$max_duration_seconds" -gt 0 ] && [ $((timestamp_epoch - collector_started_epoch)) -ge "$max_duration_seconds" ]; then break; fi
  sleep "$interval_seconds"
done
