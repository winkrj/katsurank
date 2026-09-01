#!/usr/bin/env python3
"""Persist EXP-03 run analysis before Prometheus's short retention expires."""

import csv
import json
from pathlib import Path

from analyze_exp02b import run, snapshots


ROOT = Path("loadtest/results/exp03")


def last_value(path, column):
    with path.open() as source:
        rows = list(csv.DictReader(source))
    values = [float(row[column]) for row in rows if row.get(column)]
    return values[-1] if values else 0.0


def cache_delta(label):
    path = ROOT / f"{label}-cache.csv"
    with path.open() as source:
        rows = list(csv.DictReader(source))
    first, last = rows[0], rows[-1]

    def delta(column):
        return float(last.get(column) or 0) - float(first.get(column) or 0)

    return {
        "hits": delta("cache_hits"),
        "miss_range_outside": delta("miss_range_outside"),
        "miss_cache_empty": delta("miss_cache_empty"),
        "miss_refresh_failure_fallback": delta("miss_refresh_failure_fallback"),
        "refresh_count": delta("refresh_duration_count"),
        "refresh_duration_sum_s": delta("refresh_duration_sum_seconds"),
        "refresh_failures": delta("refresh_failures"),
        "refresh_interval_count": delta("refresh_interval_count"),
        "refresh_interval_sum_s": delta("refresh_interval_sum_seconds"),
    }


def analyze(number):
    label = f"run-{number}"
    record, _ = run(label, f"exp03-cache-{number}", ROOT, ROOT / f"{label}-arrival.csv")
    cache = cache_delta(label)
    hit_or_miss = cache["hits"] + cache["miss_range_outside"] + cache["miss_cache_empty"] + cache["miss_refresh_failure_fallback"]
    before = snapshots(ROOT / f"{label}-before-prometheus.txt")
    after = snapshots(ROOT / f"{label}-after-prometheus.txt")
    acquire_count = after["hikaricp_connections_acquire_seconds_count"] - before["hikaricp_connections_acquire_seconds_count"]
    record["cache"] = {
        **cache,
        "hit_rate_pct": cache["hits"] / hit_or_miss * 100 if hit_or_miss else None,
        "refresh_mean_ms": cache["refresh_duration_sum_s"] / cache["refresh_count"] * 1000 if cache["refresh_count"] else None,
        "refresh_interval_mean_s": cache["refresh_interval_sum_s"] / cache["refresh_interval_count"] if cache["refresh_interval_count"] else None,
        "acquires_per_cache_request": acquire_count / hit_or_miss if hit_or_miss else None,
    }
    (ROOT / f"{label}-analysis.json").write_text(json.dumps(record, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps(record, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    import sys
    analyze(int(sys.argv[1]))
