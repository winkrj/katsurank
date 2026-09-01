#!/bin/sh

set -eu

results_dir=loadtest/results/exp03
while [ ! -f "$results_dir/run-1-finished-kst.txt" ]; do
  sleep 5
done

for run in 2 3 4 5; do
  sleep 300
  sh loadtest/run_exp03_cache_case.sh "$run"
done
