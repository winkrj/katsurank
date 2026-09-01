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


def numeric(row, key):
    value = row.get(key)
    return float(value) if value not in (None, "") else None


def delta(start, end, key):
    return numeric(end, key) - numeric(start, key)


def interval_rows(metric_rows, start_ms, end_ms):
    return [row for row in metric_rows if row["scrape_ok"] == "1"
            and start_ms <= int(row["timestamp_ms"]) <= end_ms]


def mean_present(rows, key):
    values = [numeric(row, key) for row in rows]
    present = [value for value in values if value is not None]
    return statistics.mean(present) if present else None


def max_present(rows, key):
    values = [numeric(row, key) for row in rows]
    present = [value for value in values if value is not None]
    return max(present) if present else None


def milliseconds(seconds):
    return seconds * 1000 if seconds is not None else None


def analyze_run(run_dir):
    with (run_dir / "phases.csv").open() as source:
        phase_rows = list(csv.DictReader(source))
    with (run_dir / "metrics.csv").open() as source:
        metric_rows = list(csv.DictReader(source))
    with (run_dir / "events.csv").open() as source:
        events = list(csv.DictReader(source))
    with (run_dir / "votes.csv").open() as source:
        votes = list(csv.DictReader(source))
    client_summary = json.loads((run_dir / "client-summary.json").read_text())
    periods = tuple(int(period) for period in client_summary["periods"])

    phases = {}
    for row in phase_rows:
        phase = row["phase"]
        phases.setdefault(phase, {})[row["action"]] = row

    result_periods = {}
    all_valid = True
    for period in periods:
        idle_phase = f"idle_{period}"
        measurement_phase = f"measurement_{period}"
        if "start" not in phases.get(idle_phase, {}) or "end" not in phases.get(measurement_phase, {}):
            raise ValueError(f"missing completed phase for {period}ms in {run_dir}")
        idle_start = phases[idle_phase]["start"]
        idle_end = phases[idle_phase]["end"]
        measurement_start = phases[measurement_phase]["start"]
        measurement_end = phases[measurement_phase]["end"]
        idle_duration = (int(idle_end["timestamp_ms"]) - int(idle_start["timestamp_ms"])) / 1000
        if idle_duration <= 0:
            raise ValueError(f"idle phase duration must be positive for {period}ms in {run_dir}")
        measurement_duration = (int(measurement_end["timestamp_ms"]) - int(measurement_start["timestamp_ms"])) / 1000
        idle_refreshes = delta(idle_start, idle_end, "refresh_count")
        idle_sql = idle_refreshes * 3
        idle_rows = interval_rows(metric_rows, int(idle_start["timestamp_ms"]), int(idle_end["timestamp_ms"]))

        period_votes = [row for row in votes if row["role"] == "measurement" and int(row["period_ms"]) == period]
        versions = {int(row["version"]) for row in period_votes}
        period_events = [row for row in events if int(row["version"]) in versions]
        first_by_version = {}
        for row in period_events:
            first_by_version.setdefault(int(row["version"]), row)
        cache_waits = [int(row["generated_at_ms"]) - int(row["changed_at_ms"])
                       for row in first_by_version.values()]
        transmissions = [int(row["received_at_ms"]) - int(row["generated_at_ms"])
                         for row in period_events]
        totals = [int(row["received_at_ms"]) - int(row["changed_at_ms"])
                  for row in period_events]

        broadcast_delta = delta(measurement_start, measurement_end, "broadcasts")
        snapshot_delta = delta(measurement_start, measurement_end, "snapshot_deliveries")
        body_delta = int(measurement_end["body_bytes"]) - int(measurement_start["body_bytes"])
        snapshot_event_body = sum(int(row["body_bytes"]) for row in period_events)
        expected_deliveries = len(period_votes) * int(client_summary["targetConnections"])
        valid = (
            len(period_votes) == int(client_summary["measurementVotes"])
            and all(float(row["broadcast_delta"]) == 1 for row in period_votes)
            and all(float(row["snapshot_delivery_delta"]) == int(client_summary["targetConnections"])
                    for row in period_votes)
            and broadcast_delta == len(period_votes)
            and snapshot_delta == expected_deliveries
        )
        all_valid = all_valid and valid

        refresh_duration_count = delta(idle_start, idle_end, "refresh_count")
        refresh_duration_sum = delta(idle_start, idle_end, "refresh_sum_seconds")
        interval_count = delta(idle_start, idle_end, "interval_count")
        interval_sum = delta(idle_start, idle_end, "interval_sum_seconds")
        result_periods[str(period)] = {
            "target_refresh_per_second": 1000 / period,
            "idle_duration_seconds": idle_duration,
            "logical_refresh_count": idle_refreshes,
            "logical_refresh_per_second": idle_refreshes / idle_duration,
            "sql_query_count": idle_sql,
            "sql_queries_per_second": idle_sql / idle_duration,
            "refresh_mean_ms": (refresh_duration_sum / refresh_duration_count * 1000)
            if refresh_duration_count else None,
            "refresh_max_observed_ms": milliseconds(max_present(idle_rows, "cache_refresh_max_seconds")),
            "realized_interval_mean_ms": (interval_sum / interval_count * 1000) if interval_count else None,
            "latency_p95_ms": {
                "cache_wait": percentile(cache_waits, 95),
                "sse_transmission": percentile(transmissions, 95),
                "total": percentile(totals, 95),
            },
            "latency_samples": {"cache_versions": len(cache_waits), "client_deliveries": len(transmissions)},
            "measurement_duration_seconds": measurement_duration,
            "broadcast_count": broadcast_delta,
            "snapshot_delivery_count": snapshot_delta,
            "snapshot_event_body_bytes": snapshot_event_body,
            "measurement_phase_body_bytes": body_delta,
            "snapshot_event_body_bytes_per_broadcast": snapshot_event_body / broadcast_delta if broadcast_delta else None,
            "refresh_failures": delta(idle_start, idle_end, "refresh_failures"),
            "send_failures": delta(measurement_start, measurement_end, "send_failures"),
            "reconnects": int(measurement_end["reconnects"]) - int(measurement_start["reconnects"]),
            "hikari_pending_max": max_present(idle_rows, "hikari_pending"),
            "process_cpu_mean": mean_present(idle_rows, "process_cpu"),
            "gc_pause_count": delta(idle_start, idle_end, "gc_count"),
            "gc_pause_sum_seconds": delta(idle_start, idle_end, "gc_sum_seconds"),
            "validation_passed": valid,
        }

    result = {
        "run": run_dir.name,
        "periods": result_periods,
        "connections": int(client_summary["targetConnections"]),
        "connect_attempts": int(client_summary["connectAttempts"]),
        "reconnects": int(client_summary["reconnects"]),
        "all_vote_broadcast_delivery_checks_passed": all_valid,
    }
    (run_dir / "analysis.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    return result


def summary(values):
    present = [value for value in values if value is not None]
    return {
        "values": values,
        "median": statistics.median(present) if present else None,
        "min": min(present) if present else None,
        "max": max(present) if present else None,
    }


def aggregate(root, runs):
    periods = tuple(int(period) for period in runs[0]["periods"].keys())
    if any(tuple(int(period) for period in run["periods"].keys()) != periods for run in runs):
        raise ValueError("all runs must contain the same cache periods in the same order")
    result_periods = {}
    prior_transmission = None
    knee = None
    knee_reasons = []
    for period in periods:
        rows = [run["periods"][str(period)] for run in runs]
        fields = {
            "logical_refresh_per_second": summary([row["logical_refresh_per_second"] for row in rows]),
            "sql_queries_per_second": summary([row["sql_queries_per_second"] for row in rows]),
            "refresh_mean_ms": summary([row["refresh_mean_ms"] for row in rows]),
            "refresh_max_observed_ms": summary([row["refresh_max_observed_ms"] for row in rows]),
            "realized_interval_mean_ms": summary([row["realized_interval_mean_ms"] for row in rows]),
            "cache_wait_p95_ms": summary([row["latency_p95_ms"]["cache_wait"] for row in rows]),
            "sse_transmission_p95_ms": summary([row["latency_p95_ms"]["sse_transmission"] for row in rows]),
            "total_p95_ms": summary([row["latency_p95_ms"]["total"] for row in rows]),
            "broadcast_count": summary([row["broadcast_count"] for row in rows]),
            "snapshot_event_body_bytes": summary([row["snapshot_event_body_bytes"] for row in rows]),
            "measurement_phase_body_bytes": summary([row["measurement_phase_body_bytes"] for row in rows]),
            "process_cpu_mean": summary([row["process_cpu_mean"] for row in rows]),
            "gc_pause_count": summary([row["gc_pause_count"] for row in rows]),
            "gc_pause_sum_seconds": summary([row["gc_pause_sum_seconds"] for row in rows]),
            "hikari_pending_max": summary([row["hikari_pending_max"] for row in rows]),
            "refresh_failures": summary([row["refresh_failures"] for row in rows]),
            "send_failures": summary([row["send_failures"] for row in rows]),
            "reconnects": summary([row["reconnects"] for row in rows]),
        }
        result_periods[str(period)] = fields

        target_rate = 1000 / period
        reasons = []
        required = ("logical_refresh_per_second", "refresh_mean_ms", "sse_transmission_p95_ms",
                    "refresh_failures", "send_failures", "reconnects")
        if any(fields[name]["median"] is None for name in required):
            reasons.append("required measurements missing")
        if (fields["logical_refresh_per_second"]["median"] is not None
                and fields["logical_refresh_per_second"]["median"] < target_rate * 0.9):
            reasons.append("actual refresh rate below 90% of target")
        if (fields["refresh_mean_ms"]["median"] is not None
                and fields["refresh_mean_ms"]["median"] >= period * 0.5):
            reasons.append("mean refresh duration reached 50% of period")
        if ((fields["refresh_failures"]["max"] or 0) > 0
                or (fields["hikari_pending_max"]["max"] or 0) > 0):
            reasons.append("refresh failure or connection-pool pending observed")
        if (fields["hikari_pending_max"]["max"] is None):
            reasons.append("connection-pool pending measurement missing")
        if ((fields["send_failures"]["max"] or 0) > 0 or (fields["reconnects"]["max"] or 0) > 0):
            reasons.append("SSE send failure or reconnect observed")
        transmission = fields["sse_transmission_p95_ms"]["median"]
        if (prior_transmission is not None and prior_transmission >= 1
                and transmission is not None and transmission >= prior_transmission * 2):
            reasons.append("SSE transmission p95 doubled from prior period")
        if knee is None and reasons:
            knee = period
            knee_reasons = reasons
        if transmission is not None:
            prior_transmission = transmission

    connection_counts = {run["connections"] for run in runs}
    if len(connection_counts) != 1:
        raise ValueError("all runs must use the same connection count")
    clients = connection_counts.pop()

    aggregate_result = {
        "runs": len(runs),
        "periods": result_periods,
        "all_preflight_valid": all(run["all_vote_broadcast_delivery_checks_passed"] for run in runs),
        "knee_period_ms": knee,
        "knee_reasons": knee_reasons,
        "polling_calculation": {
            str(period): {"clients": clients, "poll_interval_ms": period,
                          "requests_per_second": clients * 1000 / period,
                          "logical_db_refreshes_per_second": 1000 / period}
            for period in periods
        },
        "notes": [
            "DB SQL count is logical cache refresh count multiplied by the current three SELECT statements.",
            "Cache-wait latency is counted once per version; SSE transmission includes all client deliveries.",
            "Broadcasts are server messages and are not inbound HTTP requests.",
        ],
    }
    (root / "aggregate.json").write_text(json.dumps(aggregate_result, ensure_ascii=False, indent=2) + "\n")
    return aggregate_result


if __name__ == "__main__":
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "loadtest/results/exp06")
    run_dirs = sorted(path for path in root.glob("run-*") if (path / "client-summary.json").exists())
    analyses = [analyze_run(path) for path in run_dirs]
    if not analyses:
        raise SystemExit("no completed runs")
    print(json.dumps(aggregate(root, analyses), ensure_ascii=False, indent=2))
