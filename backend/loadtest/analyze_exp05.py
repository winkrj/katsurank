#!/usr/bin/env python3

import csv
import json
import statistics
import sys
from pathlib import Path


def percentile(values, percent):
    ordered = sorted(values)
    if not ordered:
        return None
    position = (len(ordered) - 1) * percent / 100
    lower = int(position)
    upper = min(lower + 1, len(ordered) - 1)
    fraction = position - lower
    return ordered[lower] + (ordered[upper] - ordered[lower]) * fraction


def number(value):
    return float(value) if value not in (None, "") else None


def analyze_run(run_dir):
    with (run_dir / "phases.csv").open() as source:
        phase_rows = list(csv.DictReader(source))
    with (run_dir / "metrics.csv").open() as source:
        metric_rows = list(csv.DictReader(source))
    with (run_dir / "votes.csv").open() as source:
        votes = list(csv.DictReader(source))
    with (run_dir / "events.csv").open() as source:
        events = list(csv.DictReader(source))
    client_summary = json.loads((run_dir / "client-summary.json").read_text())

    intervals = {}
    for row in phase_rows:
        phase = row["phase"]
        if row["action"] == "start":
            intervals[phase] = {"start": int(row["timestamp_ms"]), "start_bytes": int(row["body_bytes"]),
                                "target": int(row["target_connections"])}
        elif phase in intervals:
            intervals[phase].update(end=int(row["timestamp_ms"]), end_bytes=int(row["body_bytes"]))

    stages = {}
    for phase in ("baseline_0", "hold_250", "hold_500", "hold_1000", "cleanup_0"):
        interval = intervals[phase]
        window_start = max(interval["start"], interval["end"] - 10_000)
        rows = [row for row in metric_rows if window_start <= int(row["timestamp_ms"]) <= interval["end"]
                and row["scrape_ok"] == "1"]
        def med(column):
            values = [number(row[column]) for row in rows]
            return statistics.median(value for value in values if value is not None)
        stages[phase] = {
            "target_connections": interval["target"],
            "samples": len(rows),
            "heap_used_bytes": med("heap_used_bytes"),
            "open_fds": med("lsof_fds"),
            "established_connections": med("lsof_established"),
            "sse_active": med("sse_active"),
            "app_rss_kib": med("app_rss_kib"),
            "body_bytes": interval["end_bytes"] - interval["start_bytes"],
        }

    h0 = stages["baseline_0"]["heap_used_bytes"]
    h250 = stages["hold_250"]["heap_used_bytes"]
    h500 = stages["hold_500"]["heap_used_bytes"]
    h1000 = stages["hold_1000"]["heap_used_bytes"]
    connection_memory = {
        "0_to_250_bytes_per_connection": (h250 - h0) / 250,
        "250_to_500_bytes_per_connection": (h500 - h250) / 250,
        "500_to_1000_bytes_per_connection": (h1000 - h500) / 500,
        "0_to_1000_bytes_per_connection": (h1000 - h0) / 1000,
    }

    measurement_versions = {int(row["version"]) for row in votes if row["role"] == "measurement"}
    latency_rows = [row for row in events if int(row["version"]) in measurement_versions]
    cache_wait = [int(row["generated_at_ms"]) - int(row["changed_at_ms"]) for row in latency_rows]
    transmission = [int(row["received_at_ms"]) - int(row["generated_at_ms"]) for row in latency_rows]
    total = [int(row["received_at_ms"]) - int(row["changed_at_ms"]) for row in latency_rows]
    latency = {
        "samples": len(latency_rows),
        "events": len(measurement_versions),
        "cache_wait_ms": {key: percentile(cache_wait, value) for key, value in (("p50", 50), ("p95", 95), ("p99", 99))},
        "transmission_ms": {key: percentile(transmission, value) for key, value in (("p50", 50), ("p95", 95), ("p99", 99))},
        "total_ms": {key: percentile(total, value) for key, value in (("p50", 50), ("p95", 95), ("p99", 99))},
    }

    validation = {
        "votes": len([row for row in votes if row["role"] == "validation"]),
        "all_one_broadcast": all(float(row["broadcast_delta"]) == 1 for row in votes),
        "measurement_votes": len(measurement_versions),
    }
    result = {
        "run": run_dir.name,
        "stages": stages,
        "connection_memory": connection_memory,
        "latency": latency,
        "request_comparison": {
            "duration_seconds": client_summary["pollingComparisonSeconds"],
            "polling_requests": client_summary["pollingRequests"],
            "sse_stream_requests": client_summary["sseStreamRequests"],
            "reconnects": client_summary["reconnects"],
            "reduction_multiple": client_summary["requestReduction"],
            "note": "broadcasts and heartbeats are server transmissions, not received HTTP requests",
        },
        "network": {
            "total_sse_body_bytes": client_summary["bodyBytes"],
            "no_change_1000_body_bytes": stages["hold_1000"]["body_bytes"],
            "propagation_body_bytes": intervals["propagation"]["end_bytes"] - intervals["propagation"]["start_bytes"],
        },
        "validation": validation,
    }
    (run_dir / "analysis.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    return result


def aggregate(root, runs):
    def run_values(path):
        return [path(run) for run in runs]

    def summary(values):
        return {"values": values, "median": statistics.median(values), "min": min(values), "max": max(values)}

    stages = {}
    for phase in ("baseline_0", "hold_250", "hold_500", "hold_1000", "cleanup_0"):
        stages[phase] = {
            "heap_used_bytes": summary(run_values(lambda run, p=phase: run["stages"][p]["heap_used_bytes"])),
            "open_fds": summary(run_values(lambda run, p=phase: run["stages"][p]["open_fds"])),
        }
    keys = runs[0]["connection_memory"].keys()
    memory = {key: summary(run_values(lambda run, k=key: run["connection_memory"][k])) for key in keys}
    aggregate_result = {
        "runs": len(runs),
        "stages": stages,
        "connection_memory": memory,
        "latency_p95_ms": {
            "cache_wait": summary(run_values(lambda run: run["latency"]["cache_wait_ms"]["p95"])),
            "transmission": summary(run_values(lambda run: run["latency"]["transmission_ms"]["p95"])),
            "total": summary(run_values(lambda run: run["latency"]["total_ms"]["p95"])),
        },
        "request_reduction_multiple": summary(run_values(lambda run: run["request_comparison"]["reduction_multiple"])),
        "all_preflight_valid": all(run["validation"]["all_one_broadcast"] for run in runs),
    }
    (root / "aggregate.json").write_text(json.dumps(aggregate_result, ensure_ascii=False, indent=2) + "\n")
    return aggregate_result


if __name__ == "__main__":
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "loadtest/results/exp05")
    run_dirs = sorted(path for path in root.glob("run-*") if (path / "client-summary.json").exists())
    analyses = [analyze_run(path) for path in run_dirs]
    if not analyses:
        raise SystemExit("no completed runs")
    print(json.dumps(aggregate(root, analyses), ensure_ascii=False, indent=2))
