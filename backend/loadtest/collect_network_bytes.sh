#!/bin/sh
set -eu
interface=${NETWORK_INTERFACE:-lo0}
output=${OUTPUT_FILE:-loadtest/network.csv}
duration=${MAX_DURATION_SECONDS:-0}
started=$(date +%s)
mkdir -p "$(dirname "$output")"
printf '%s\n' 'timestamp_epoch,timestamp_utc,interface,ibytes,obytes' > "$output"
while :; do
  now=$(date +%s); utc=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
  values=$(netstat -ibn -I "$interface" | awk '$4 == "127.0.0.1" {print $7","$10; exit}')
  printf '%s,%s,%s,%s\n' "$now" "$utc" "$interface" "$values" >> "$output"
  [ "$duration" -gt 0 ] && [ $((now-started)) -ge "$duration" ] && break
  sleep 1
done
