#!/usr/bin/env python3
"""Aggregate EXP-02 results. Prometheus queries are restricted to k6 test tags."""

import csv
import json
import math
import statistics
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

ROOT = Path('loadtest/results/exp02')
PROM = 'http://localhost:9090/api/v1/query_range'
CASES = {
    'interval-30-first': {'interval': 30, 'testid': 'exp02-interval-30-first'},
    'interval-2': {'interval': 2, 'testid': 'exp02-interval-2'},
    'interval-1': {'interval': 1, 'testid': 'exp02-interval-1'},
    'interval-30-repeat': {'interval': 30, 'testid': 'exp02-interval-30-repeat'},
}


def epoch(path):
    return int(datetime.strptime(path.read_text().strip(), '%Y-%m-%dT%H:%M:%S%z').timestamp())


def prometheus(query, start, end):
    params = urlencode({'query': query, 'start': start, 'end': end, 'step': '1'})
    with urlopen(f'{PROM}?{params}', timeout=120) as response:
        return json.load(response)['data']['result']


def values(metric, testid, start, end, load_stage='hold_1000'):
    selector = f'{metric}{{testid="{testid}",load_stage="{load_stage}"}}'
    series = prometheus(selector, start, end)
    if not series:
        return []
    return [float(value) for _, value in series[0]['values'] if value != 'NaN']


def parse_snapshot(path):
    metrics = {}
    for line in path.read_text().splitlines():
        if not line.startswith('hikaricp_connections_'):
            continue
        name, value = line.rsplit(' ', 1)
        if name.startswith('hikaricp_connections_usage_seconds_') or name.startswith('hikaricp_connections_acquire_seconds_'):
            metrics[name.split('{', 1)[0]] = float(value)
    return metrics


def percentile_from_buckets(path, metric, start, end):
    by_time = {}
    with path.open() as file:
        for row in csv.DictReader(file):
            if row['metric'] != metric:
                continue
            timestamp = int(row['timestamp_epoch'])
            if timestamp <= end:
                by_time.setdefault(timestamp, {})[row['le']] = float(row['cumulative_count'])
    timestamps = sorted(by_time)
    before = max((ts for ts in timestamps if ts <= start), default=None)
    after = max((ts for ts in timestamps if ts <= end), default=None)
    if before is None or after is None or after <= before:
        return None
    delta = {le: by_time[after].get(le, 0) - by_time[before].get(le, 0) for le in by_time[after]}
    total = delta.get('+Inf', 0)
    if total <= 0:
        return None
    target = total * .95
    lower_bound = 0.0
    lower_count = 0.0
    for upper_bound, count in sorted(
            (float(le), count) for le, count in delta.items() if le != '+Inf'):
        if count >= target:
            bucket_count = count - lower_count
            if bucket_count <= 0:
                return upper_bound
            position = (target - lower_count) / bucket_count
            return lower_bound + (upper_bound - lower_bound) * position
        lower_bound = upper_bound
        lower_count = count
    return None


def csv_max(path, start, end, column):
    data = []
    with path.open() as file:
        for row in csv.DictReader(file):
            if start <= int(row['timestamp_epoch']) <= end and row[column]:
                data.append(float(row[column]))
    return max(data) if data else None


def summary_stat(metric, testid, start, end, transform=1, load_stage='hold_1000'):
    series = values(metric, testid, start, end, load_stage)
    return statistics.median(series) * transform if series else None


def main():
    report = {}
    for label, meta in CASES.items():
        started = epoch(ROOT / f'{label}-started-kst.txt')
        hold_start, hold_end = started + 140, started + 200
        before = parse_snapshot(ROOT / f'{label}-before-prometheus.txt')
        after = parse_snapshot(ROOT / f'{label}-after-prometheus.txt')
        usage_count = after['hikaricp_connections_usage_seconds_count'] - before['hikaricp_connections_usage_seconds_count']
        usage_sum = after['hikaricp_connections_usage_seconds_sum'] - before['hikaricp_connections_usage_seconds_sum']
        acq_count = after['hikaricp_connections_acquire_seconds_count'] - before['hikaricp_connections_acquire_seconds_count']
        acq_sum = after['hikaricp_connections_acquire_seconds_sum'] - before['hikaricp_connections_acquire_seconds_sum']
        reqs = values('k6_http_reqs_total', meta['testid'], hold_start, hold_end)
        hold_requests = max(reqs) if reqs else None
        stages = {}
        for vus, phase_start, phase_end in ((250, started + 20, started + 60), (500, started + 80, started + 120), (1000, hold_start, hold_end)):
            load_stage = f'hold_{vus}'
            reqs = values('k6_http_reqs_total', meta['testid'], phase_start, phase_end, load_stage)
            stages[str(vus)] = {
                'rps': max(reqs) / (phase_end - phase_start) if reqs else None,
                'http_p95_ms': summary_stat(
                    'k6_http_req_duration_p95', meta['testid'], phase_start, phase_end, 1000, load_stage),
                'pending_max': csv_max(ROOT / f'{label}-metrics.csv', phase_start, phase_end, 'hikari_pending'),
            }
        report[label] = {
            'interval_seconds': meta['interval'],
            'hold_epoch': [hold_start, hold_end],
            'hold_requests': hold_requests,
            'hold_rps': hold_requests / 60 if hold_requests is not None else None,
            'http_ms': {name: summary_stat(f'k6_http_req_duration_{name}', meta['testid'], hold_start, hold_end, 1000) for name in ('p50', 'p95', 'p99', 'max')},
            'connecting_ms': summary_stat('k6_http_req_connecting_p95', meta['testid'], hold_start, hold_end, 1000),
            'w_ms_full_run_snapshot_delta': usage_sum / usage_count * 1000 if usage_count else None,
            'acquire_per_request_full_run_snapshot_delta': acq_count / usage_count if usage_count else None,
            'acquire_p95_seconds_hold': percentile_from_buckets(ROOT / f'{label}-buckets.csv', 'hikaricp_connections_acquire_seconds_bucket', hold_start, hold_end),
            'usage_p95_seconds_hold': percentile_from_buckets(ROOT / f'{label}-buckets.csv', 'hikaricp_connections_usage_seconds_bucket', hold_start, hold_end),
            'gc_pause_p95_seconds_hold': percentile_from_buckets(ROOT / f'{label}-buckets.csv', 'jvm_gc_pause_seconds_bucket', hold_start, hold_end),
            'pending_max_hold': csv_max(ROOT / f'{label}-metrics.csv', hold_start, hold_end, 'hikari_pending'),
            'active_max_hold': csv_max(ROOT / f'{label}-metrics.csv', hold_start, hold_end, 'hikari_active'),
            'system_cpu_max_hold_pct': csv_max(ROOT / f'{label}-metrics.csv', hold_start, hold_end, 'host_system_cpu_pct_of_machine'),
            'k6_cpu_max_hold_pct': csv_max(ROOT / f'{label}-metrics.csv', hold_start, hold_end, 'k6_cpu_pct_of_machine'),
            'unaccounted_cpu_max_hold_pct': csv_max(ROOT / f'{label}-metrics.csv', hold_start, hold_end, 'unaccounted_cpu_pct_of_machine'),
            'stages': stages,
        }
    json.dump(report, sys.stdout, indent=2, ensure_ascii=False)


if __name__ == '__main__':
    main()
