#!/bin/sh

set -eu

app_pid=${APP_PID:?APP_PID is required}
output_file=${OUTPUT_FILE:?OUTPUT_FILE is required}
max_duration_seconds=${MAX_DURATION_SECONDS:-900}
actuator_base_url=${ACTUATOR_BASE_URL:-http://localhost:8080}
started_epoch=$(date +%s)
next_sample_epoch=$started_epoch
snapshot_file=$(mktemp "${TMPDIR:-/tmp}/katsurank-exp06.XXXXXX")

if command -v lsof >/dev/null 2>&1 && lsof -nP -a -p "$app_pid" >/dev/null 2>&1; then
  lsof_available=1
else
  lsof_available=0
fi

cleanup() { rm -f "$snapshot_file"; }
trap cleanup EXIT
trap 'exit 0' INT TERM

mkdir -p "$(dirname "$output_file")"
printf '%s\n' 'timestamp_ms,scrape_ok,process_open_fds,tomcat_connections,sse_active,sse_opened,sse_closed,sse_broadcasts,snapshot_deliveries,heartbeat_deliveries,send_failures,cache_refresh_count,cache_refresh_sum_seconds,cache_refresh_max_seconds,cache_interval_count,cache_interval_sum_seconds,cache_interval_max_seconds,cache_refresh_failures,hikari_active,hikari_pending,hikari_acquire_count,hikari_acquire_sum_seconds,process_cpu,system_cpu,gc_pause_count,gc_pause_sum_seconds,lsof_fds,lsof_established,app_rss_kib,app_vsz_kib' > "$output_file"

while kill -0 "$app_pid" 2>/dev/null; do
  timestamp_ms=$(($(date +%s) * 1000))
  if curl -fsS --connect-timeout 2 --max-time 5 "$actuator_base_url/actuator/prometheus" -o "$snapshot_file"; then
    scrape_ok=1
    values=$(awk '
      function metric_name(token, parts) { split(token, parts, "{"); return parts[1] }
      function label(token, name, marker, rest, end) { marker=name "=\""; if (index(token, marker)==0) return ""; rest=substr(token,index(token,marker)+length(marker)); end=index(rest,"\""); return substr(rest,1,end-1) }
      function cell(seen, value) { return seen ? sprintf("%.17g", value) : "" }
      $0 !~ /^#/ {
        name=metric_name($1); value=$NF+0
        if (name=="process_files_open_files") { openfd+=value; openfd_s=1 }
        else if (name=="tomcat_connections_current_connections") { tomcat+=value; tomcat_s=1 }
        else if (name=="ranking_sse_connections_active") { active+=value; active_s=1 }
        else if (name=="ranking_sse_connections_opened_total") { opened+=value; opened_s=1 }
        else if (name=="ranking_sse_connections_closed_total") { closed+=value; closed_s=1 }
        else if (name=="ranking_sse_broadcasts_total") { broadcasts+=value; broadcasts_s=1 }
        else if (name=="ranking_sse_deliveries_total" && label($0,"type")=="snapshot") { snapshots+=value; snapshots_s=1 }
        else if (name=="ranking_sse_deliveries_total" && label($0,"type")=="heartbeat") { heartbeats+=value; heartbeats_s=1 }
        else if (name=="ranking_sse_send_failures_total") { failures+=value; failures_s=1 }
        else if (name=="ranking_cache_refresh_duration_seconds_count") { refreshc+=value; refreshc_s=1 }
        else if (name=="ranking_cache_refresh_duration_seconds_sum") { refreshs+=value; refreshs_s=1 }
        else if (name=="ranking_cache_refresh_duration_seconds_max") { refreshm+=value; refreshm_s=1 }
        else if (name=="ranking_cache_refresh_interval_seconds_count") { intervalc+=value; intervalc_s=1 }
        else if (name=="ranking_cache_refresh_interval_seconds_sum") { intervals+=value; intervals_s=1 }
        else if (name=="ranking_cache_refresh_interval_seconds_max") { intervalm+=value; intervalm_s=1 }
        else if (name=="ranking_cache_refresh_failures_total") { refreshf+=value; refreshf_s=1 }
        else if (name=="hikaricp_connections_active") { ha+=value; ha_s=1 }
        else if (name=="hikaricp_connections_pending") { hp+=value; hp_s=1 }
        else if (name=="hikaricp_connections_acquire_seconds_count") { hac+=value; hac_s=1 }
        else if (name=="hikaricp_connections_acquire_seconds_sum") { has+=value; has_s=1 }
        else if (name=="process_cpu_usage") { pcpu+=value; pcpu_s=1 }
        else if (name=="system_cpu_usage") { scpu+=value; scpu_s=1 }
        else if (name=="jvm_gc_pause_seconds_count") { gcc+=value; gcc_s=1 }
        else if (name=="jvm_gc_pause_seconds_sum") { gcs+=value; gcs_s=1 }
      }
      END { printf "%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s", cell(openfd_s,openfd),cell(tomcat_s,tomcat),cell(active_s,active),cell(opened_s,opened),cell(closed_s,closed),cell(broadcasts_s,broadcasts),cell(snapshots_s,snapshots),cell(heartbeats_s,heartbeats),cell(failures_s,failures),cell(refreshc_s,refreshc),cell(refreshs_s,refreshs),cell(refreshm_s,refreshm),cell(intervalc_s,intervalc),cell(intervals_s,intervals),cell(intervalm_s,intervalm),cell(refreshf_s,refreshf),cell(ha_s,ha),cell(hp_s,hp),cell(hac_s,hac),cell(has_s,has),cell(pcpu_s,pcpu),cell(scpu_s,scpu),cell(gcc_s,gcc),cell(gcs_s,gcs) }
    ' "$snapshot_file")
  else
    scrape_ok=0
    values=$(awk 'BEGIN { for (i=1; i<24; i++) printf "," }')
  fi

  lsof_fds=
  lsof_established=
  if [ "$lsof_available" -eq 1 ]; then
    lsof_fds=$(lsof -nP -a -p "$app_pid" -d 0-999999 2>/dev/null | awk 'NR>1 {count++} END {print count+0}')
    lsof_established=$(lsof -nP -a -p "$app_pid" -iTCP -sTCP:ESTABLISHED 2>/dev/null | awk 'NR>1 {count++} END {print count+0}')
  fi
  process_values=$(ps -p "$app_pid" -o rss= -o vsz= 2>/dev/null | awk '{print $1 "," $2}')
  app_rss=$(printf '%s\n' "$process_values" | cut -d, -f1)
  app_vsz=$(printf '%s\n' "$process_values" | cut -d, -f2)
  printf '%s,%s,%s,%s,%s,%s,%s\n' "$timestamp_ms" "$scrape_ok" "$values" "$lsof_fds" "$lsof_established" "$app_rss" "$app_vsz" >> "$output_file"

  now_epoch=$(date +%s)
  if [ $((now_epoch - started_epoch)) -ge "$max_duration_seconds" ]; then break; fi
  next_sample_epoch=$((next_sample_epoch + 1))
  while [ "$next_sample_epoch" -le "$now_epoch" ]; do
    next_sample_epoch=$((next_sample_epoch + 1))
  done
  sleep $((next_sample_epoch - now_epoch))
done
