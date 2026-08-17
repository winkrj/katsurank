#!/bin/sh

set -eu

app_pid=${APP_PID:?APP_PID is required}
output_file=${OUTPUT_FILE:?OUTPUT_FILE is required}
max_duration_seconds=${MAX_DURATION_SECONDS:-900}
actuator_base_url=${ACTUATOR_BASE_URL:-http://localhost:8080}
started_epoch=$(date +%s)
snapshot_file=$(mktemp "${TMPDIR:-/tmp}/katsurank-exp05.XXXXXX")

cleanup() {
  rm -f "$snapshot_file"
}
trap cleanup EXIT
trap 'exit 0' INT TERM

mkdir -p "$(dirname "$output_file")"
printf '%s\n' 'timestamp_ms,scrape_ok,heap_used_bytes,process_open_fds,tomcat_connections,sse_active,sse_opened,sse_closed,sse_broadcasts,snapshot_deliveries,heartbeat_deliveries,send_failures,cache_refresh_count,http_polling_count,http_stream_count,lsof_fds,lsof_established,app_rss_kib,app_vsz_kib,process_cpu,system_cpu,gc_pause_count,gc_pause_sum_seconds' > "$output_file"

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
        if (name=="jvm_memory_used_bytes" && label($1,"area")=="heap") { heap+=value; heap_s=1 }
        else if (name=="process_files_open_files") { openfd+=value; openfd_s=1 }
        else if (name=="tomcat_connections_current_connections") { tomcat+=value; tomcat_s=1 }
        else if (name=="ranking_sse_connections_active") { active+=value; active_s=1 }
        else if (name=="ranking_sse_connections_opened_total") { opened+=value; opened_s=1 }
        else if (name=="ranking_sse_connections_closed_total") { closed+=value; closed_s=1 }
        else if (name=="ranking_sse_broadcasts_total") { broadcasts+=value; broadcasts_s=1 }
        else if (name=="ranking_sse_deliveries_total" && label($1,"type")=="snapshot") { snapshots+=value; snapshots_s=1 }
        else if (name=="ranking_sse_deliveries_total" && label($1,"type")=="heartbeat") { heartbeats+=value; heartbeats_s=1 }
        else if (name=="ranking_sse_send_failures_total") { failures+=value; failures_s=1 }
        else if (name=="ranking_cache_refresh_duration_seconds_count") { refresh+=value; refresh_s=1 }
        else if (name=="http_server_requests_seconds_count" && label($1,"uri")=="/api/v1/ranking") { polling+=value; polling_s=1 }
        else if (name=="http_server_requests_seconds_count" && label($1,"uri")=="/api/v1/ranking/stream") { stream+=value; stream_s=1 }
        else if (name=="process_cpu_usage") { pcpu+=value; pcpu_s=1 }
        else if (name=="system_cpu_usage") { scpu+=value; scpu_s=1 }
        else if (name=="jvm_gc_pause_seconds_count") { gcc+=value; gcc_s=1 }
        else if (name=="jvm_gc_pause_seconds_sum") { gcs+=value; gcs_s=1 }
      }
      END { printf "%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s", cell(heap_s,heap),cell(openfd_s,openfd),cell(tomcat_s,tomcat),cell(active_s,active),cell(opened_s,opened),cell(closed_s,closed),cell(broadcasts_s,broadcasts),cell(snapshots_s,snapshots),cell(heartbeats_s,heartbeats),cell(failures_s,failures),cell(refresh_s,refresh),cell(polling_s,polling),cell(stream_s,stream),cell(pcpu_s,pcpu),cell(scpu_s,scpu),cell(gcc_s,gcc),cell(gcs_s,gcs) }
    ' "$snapshot_file")
  else
    scrape_ok=0
    values=',,,,,,,,,,,,,,,,,,'
  fi

  lsof_fds=$(lsof -nP -a -p "$app_pid" -d 0-999999 2>/dev/null | awk 'NR>1 {count++} END {print count+0}')
  lsof_established=$(lsof -nP -a -p "$app_pid" -iTCP -sTCP:ESTABLISHED 2>/dev/null | awk 'NR>1 {count++} END {print count+0}')
  process_values=$(ps -p "$app_pid" -o rss= -o vsz= 2>/dev/null | awk '{print $1 "," $2}')
  app_rss=$(printf '%s\n' "$process_values" | cut -d, -f1)
  app_vsz=$(printf '%s\n' "$process_values" | cut -d, -f2)
  prefix=$(printf '%s\n' "$values" | cut -d, -f1-13)
  suffix=$(printf '%s\n' "$values" | cut -d, -f14-)
  printf '%s,%s,%s,%s,%s,%s,%s\n' "$timestamp_ms" "$scrape_ok" "$prefix" "$lsof_fds" "$lsof_established" "$app_rss" "$app_vsz,$suffix" >> "$output_file"

  if [ $(( $(date +%s) - started_epoch )) -ge "$max_duration_seconds" ]; then break; fi
  sleep 1
done
