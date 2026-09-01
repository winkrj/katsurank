#!/usr/bin/env python3

import csv
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parent
RESULTS = ROOT / "results"
OUTPUT = RESULTS / "exp01-timeseries-response-cpu.svg"
METRICS = (
    "hikaricp_connections_acquire_seconds_bucket",
    "hikaricp_connections_usage_seconds_bucket",
    "http_server_requests_seconds_bucket",
)


def read_rows(run):
    with (RESULTS / f"exp01-run{run}-metrics.csv").open(newline="") as file:
        rows = list(csv.DictReader(file))
    start = int(rows[0]["timestamp_epoch"])
    for row in rows:
        row["elapsed"] = int(row["timestamp_epoch"]) - start
    return rows


def read_buckets(run):
    snapshots = {}
    with (RESULTS / f"exp01-run{run}-metrics_buckets.csv").open(newline="") as file:
        for row in csv.DictReader(file):
            if row["metric"] not in METRICS:
                continue
            timestamp = int(row["timestamp_epoch"])
            snapshots.setdefault(timestamp, {}).setdefault(row["metric"], {})[
                row["le"]
            ] = float(row["cumulative_count"])
    return snapshots


def percentile_delta(previous, current, percentile=0.95):
    total = current.get("+Inf", 0) - previous.get("+Inf", 0)
    if total <= 0:
        return float("nan")
    target = total * percentile
    bounds = sorted((float(key), key) for key in current if key != "+Inf")
    lower_bound = 0.0
    lower_count = 0.0
    for upper_bound, original_key in bounds:
        cumulative_count = current.get(original_key, 0) - previous.get(original_key, 0)
        if cumulative_count >= target:
            bucket_count = cumulative_count - lower_count
            if bucket_count <= 0:
                return upper_bound * 1000
            position = (target - lower_count) / bucket_count
            return (lower_bound + (upper_bound - lower_bound) * position) * 1000
        lower_bound = upper_bound
        lower_count = cumulative_count
    return float("nan")


def series(run):
    rows = read_rows(run)
    buckets = read_buckets(run)
    start = int(rows[0]["timestamp_epoch"])
    result = []
    previous = None
    for row in rows:
        timestamp = int(row["timestamp_epoch"])
        if previous is None:
            previous = row
            continue
        elapsed_seconds = timestamp - int(previous["timestamp_epoch"])
        if elapsed_seconds <= 0:
            continue
        request_delta = (
            float(row["http_requests_count"])
            - float(previous["http_requests_count"])
        )
        previous_buckets = buckets.get(int(previous["timestamp_epoch"]), {})
        current_buckets = buckets.get(timestamp, {})
        http_p95 = percentile_delta(
            previous_buckets.get("http_server_requests_seconds_bucket", {}),
            current_buckets.get("http_server_requests_seconds_bucket", {}),
        )
        result.append(
            {
                "elapsed": timestamp - start,
                "timestamp": row["timestamp_utc"],
                "request_rate": request_delta / elapsed_seconds,
                "pending": float(row["hikari_pending"] or 0),
                "process_cpu": float(row["process_cpu_usage"] or 0) * 100,
                "system_cpu": float(row["system_cpu_usage"] or 0) * 100,
                "k6_cpu": float(row["k6_cpu_percent"] or 0),
                "memory_mib": float(row["jvm_memory_used_bytes"] or 0) / 1024**2,
                "http_p95_ms": http_p95,
            }
        )
        previous = row
    return result


def plot(all_series):
    width, height = 1800, 1050
    left, top, column_width, row_height = 80, 80, 560, 285
    colors = {"request": "#2563eb", "pending": "#dc2626", "latency": "#7c3aed", "system": "#ea580c", "process": "#16a34a", "k6": "#0891b2", "memory": "#64748b"}
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">', '<rect width="100%" height="100%" fill="#f8fafc"/>', '<style>text{font-family:Arial,sans-serif;font-size:13px;fill:#111827}.title{font-size:22px;font-weight:bold}.run{font-size:17px;font-weight:bold}.grid{stroke:#d1d5db;stroke-width:1}.stage{fill:#f59e0b;opacity:.12}</style>', '<text x="80" y="38" class="title">EXP-01 time series: response latency and CPU overlap</text>', '<text x="80" y="60">Orange band: ramp to 4,000 VU (350–360s). HTTP p95 includes ranking and Actuator scrape.</text>']

    def polyline(points, key, x, y, w, h, maximum, color):
        coords = []
        for point in points:
            value = point[key]
            if isinstance(value, float) and math.isnan(value):
                continue
            px = x + min(point["elapsed"], 420) / 420 * w
            py = y + h - min(value, maximum) / maximum * h
            coords.append(f"{px:.1f},{py:.1f}")
        svg.append(f'<polyline points="{" ".join(coords)}" fill="none" stroke="{color}" stroke-width="1.4"/>')

    for column, (run, points) in enumerate(all_series.items()):
        x = left + column * column_width
        svg.append(f'<text x="{x}" y="{top - 10}" class="run">Run {run}</text>')
        panels = [
            ("HTTP req/s + Hikari pending", [("request_rate", 650, colors["request"]), ("pending", 200, colors["pending"])]),
            ("Mixed HTTP interval p95 + system CPU", [("http_p95_ms", 3000, colors["latency"]), ("system_cpu", 100, colors["system"])]),
            ("JVM CPU + k6 CPU + JVM memory", [("process_cpu", 130, colors["process"]), ("k6_cpu", 130, colors["k6"]), ("memory_mib", 450, colors["memory"])])]
        for row_index, (label, lines) in enumerate(panels):
            y = top + row_index * row_height
            plot_width, plot_height = 500, 220
            svg.append(f'<rect x="{x}" y="{y}" width="{plot_width}" height="{plot_height}" fill="none" stroke="#9ca3af"/>')
            svg.append(f'<rect x="{x + 350 / 420 * plot_width:.1f}" y="{y}" width="{10 / 420 * plot_width:.1f}" height="{plot_height}" class="stage"/>')
            for fraction in (0.25, 0.5, 0.75):
                gy = y + plot_height * fraction
                svg.append(f'<line x1="{x}" y1="{gy}" x2="{x + plot_width}" y2="{gy}" class="grid"/>')
            svg.append(f'<text x="{x + 6}" y="{y + 18}">{label}</text>')
            for key, maximum, color in lines:
                polyline(points, key, x, y, plot_width, plot_height, maximum, color)
            if row_index == 2:
                for second in (0, 60, 120, 180, 240, 300, 360, 420):
                    tx = x + second / 420 * plot_width
                    svg.append(f'<text x="{tx - 8}" y="{y + plot_height + 20}">{second}</text>')
                svg.append(f'<text x="{x + 180}" y="{y + plot_height + 42}">seconds from collector start</text>')
    svg.append(f'<text x="80" y="1025" fill="{colors["request"]}">blue=request rate</text><text x="230" y="1025" fill="{colors["pending"]}">red=pending</text><text x="345" y="1025" fill="{colors["latency"]}">purple=HTTP p95</text><text x="500" y="1025" fill="{colors["system"]}">orange=system CPU</text><text x="680" y="1025" fill="{colors["process"]}">green=JVM CPU</text><text x="820" y="1025" fill="{colors["k6"]}">cyan=k6 CPU</text><text x="950" y="1025" fill="{colors["memory"]}">gray=JVM memory</text>')
    svg.append('</svg>')
    OUTPUT.write_text("\n".join(svg))


def main():
    all_series = {run: series(run) for run in (1, 2, 3)}
    plot(all_series)
    for run, points in all_series.items():
        spikes = [point for point in points if point["pending"] > 0]
        for point in spikes:
            print(
                f"run={run} timestamp={point['timestamp']} elapsed={point['elapsed']} "
                f"pending={point['pending']:.0f} req_s={point['request_rate']:.1f} "
                f"system_cpu={point['system_cpu']:.1f}% process_cpu={point['process_cpu']:.1f}% "
                f"k6_cpu={point['k6_cpu']:.1f}% memory={point['memory_mib']:.1f}MiB "
                f"mixed_http_p95={point['http_p95_ms']:.3f}ms"
            )
    print(OUTPUT)


if __name__ == "__main__":
    main()
