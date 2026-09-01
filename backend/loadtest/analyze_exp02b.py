#!/usr/bin/env python3
"""Aggregate the 1,000-VU hold of EXP-02B and its EXP-02 baseline."""

import csv
import json
import statistics
from datetime import datetime
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

ROOT = Path('loadtest/results')
PROM = 'http://localhost:9090/api/v1/query_range'


def epoch(path):
    return int(datetime.strptime(path.read_text().strip(), '%Y-%m-%dT%H:%M:%S%z').timestamp())


def query_range(query, start, end, step='1'):
    args = urlencode({'query': query, 'start': start, 'end': end, 'step': step})
    with urlopen(f'{PROM}?{args}', timeout=120) as response:
        payload = json.load(response)
    if payload['status'] != 'success':
        raise RuntimeError(payload)
    return payload['data']['result']


def tagged_values(metric, testid, start, end):
    result = query_range(f'{metric}{{testid="{testid}",load_stage="hold_1000"}}', start, end)
    return [float(v) for _, v in result[0]['values'] if v != 'NaN'] if result else []


def stat(metric, testid, start, end, scale=1):
    vals = tagged_values(metric, testid, start, end)
    return statistics.median(vals) * scale if vals else None


def snapshots(path):
    values = {}
    for line in path.read_text().splitlines():
        if line.startswith('hikaricp_connections_usage_seconds_') or line.startswith('hikaricp_connections_acquire_seconds_'):
            metric, value = line.rsplit(' ', 1)
            values[metric.split('{', 1)[0]] = float(value)
    return values


def bucket_p95(path, metric, start, end):
    grouped = {}
    with path.open() as file:
        for row in csv.DictReader(file):
            if row['metric'] == metric and int(row['timestamp_epoch']) <= end:
                grouped.setdefault(int(row['timestamp_epoch']), {})[row['le']] = float(row['cumulative_count'])
    timestamps = sorted(grouped)
    before = max((t for t in timestamps if t <= start), default=None)
    after = max((t for t in timestamps if t <= end), default=None)
    if before is None or after is None:
        return None
    delta = {key: grouped[after].get(key, 0) - grouped[before].get(key, 0) for key in grouped[after]}
    total = delta.get('+Inf', 0)
    if not total:
        return None
    target = total * .95
    lower_bound = 0.0
    lower_count = 0.0
    for upper_bound, count in sorted((float(k), v) for k, v in delta.items() if k != '+Inf'):
        if count >= target:
            bucket_count = count - lower_count
            if bucket_count <= 0:
                return upper_bound
            position = (target - lower_count) / bucket_count
            return lower_bound + (upper_bound - lower_bound) * position
        lower_bound = upper_bound
        lower_count = count
    return None


def csv_values(path, start, end, column):
    with path.open() as file:
        return [float(row[column]) for row in csv.DictReader(file)
                if start <= int(row['timestamp_epoch']) <= end and row.get(column)]


def counter_rate(path, start, end, column):
    rows = []
    with path.open() as file:
        for row in csv.DictReader(file):
            timestamp = int(row['timestamp_epoch'])
            if start <= timestamp <= end and row.get(column):
                rows.append((timestamp, float(row[column])))
    if len(rows) < 2 or rows[-1][0] == rows[0][0]:
        return None
    return (rows[-1][1] - rows[0][1]) / (rows[-1][0] - rows[0][0])


def arrival_from_csv(path, start, end):
    samples = []
    with path.open() as file:
        rows = list(csv.DictReader(file))
    previous = None
    for row in rows:
        now = int(row['timestamp_epoch'])
        value = float(row['http_ranking_requests_count'])
        if previous:
            old_time, old_value = previous
            if start < now <= end and 0 < now - old_time <= 2:
                samples.append((now, (value - old_value) / (now - old_time)))
        previous = (now, value)
    return samples


def arrival_from_prometheus(start, end):
    # Sum all ranking counter series first; samples are then consecutive 1-s deltas.
    result = query_range('sum(http_server_requests_seconds_count{uri="/api/v1/ranking"})', start - 2, end, '1s')
    if not result:
        return []
    values = result[0]['values']
    output = []
    previous = None
    for time, raw in values:
        now, value = int(float(time)), float(raw)
        if previous:
            old_time, old_value = previous
            if start < now <= end and 0 < now - old_time <= 2:
                output.append((now, (value - old_value) / (now - old_time)))
        previous = (now, value)
    return output


def arrival_stats(samples):
    values = [value for _, value in samples]
    return {
        'n': len(values),
        'max_rps': max(values) if values else None,
        'mean_rps': statistics.mean(values) if values else None,
        'stddev_rps': statistics.stdev(values) if len(values) > 1 else None,
    }


def summary_extra(path):
    metrics = json.loads(path.read_text())['metrics']
    iteration = metrics['iteration_duration']
    iteration_values = iteration.get('values', iteration)
    return {
        'dropped_iterations': metrics.get('dropped_iterations', {}).get('values', {}).get('count', 0),
        'iteration_duration_p95_ms': iteration_values.get('p(95)'),
    }


def run(label, testid, root, arrival_file=None):
    started = epoch(root / f'{label}-started-kst.txt')
    start, end = started + 140, started + 200
    before, after = snapshots(root / f'{label}-before-prometheus.txt'), snapshots(root / f'{label}-after-prometheus.txt')
    usage_count = after['hikaricp_connections_usage_seconds_count'] - before['hikaricp_connections_usage_seconds_count']
    usage_sum = after['hikaricp_connections_usage_seconds_sum'] - before['hikaricp_connections_usage_seconds_sum']
    acquire_count = after['hikaricp_connections_acquire_seconds_count'] - before['hikaricp_connections_acquire_seconds_count']
    reqs = tagged_values('k6_http_reqs_total', testid, start, end)
    arrival = arrival_from_csv(arrival_file, start, end) if arrival_file and arrival_file.exists() else arrival_from_prometheus(start, end)
    metric_csv = root / f'{label}-metrics.csv'
    record = {
        'hold_epoch': [start, end],
        'rps': max(reqs) / 60 if reqs else None,
        'achievement_pct': (max(reqs) / 60) / 500 * 100 if reqs else None,
        'arrival': arrival_stats(arrival),
        'http_ms': {p: stat(f'k6_http_req_duration_{p}', testid, start, end, 1000) for p in ('p50', 'p95', 'p99', 'max')},
        'connecting_p95_ms': stat('k6_http_req_connecting_p95', testid, start, end, 1000),
        'w_ms_snapshot': usage_sum / usage_count * 1000 if usage_count else None,
        'acquire_per_request_snapshot': acquire_count / usage_count if usage_count else None,
        'acquire_p95_s': bucket_p95(root / f'{label}-buckets.csv', 'hikaricp_connections_acquire_seconds_bucket', start, end),
        'gc_pause_p95_s': bucket_p95(root / f'{label}-buckets.csv', 'jvm_gc_pause_seconds_bucket', start, end),
        'pending_max': max(csv_values(metric_csv, start, end, 'hikari_pending'), default=None),
        'active_max': max(csv_values(metric_csv, start, end, 'hikari_active'), default=None),
        'system_cpu_max_pct': max(csv_values(metric_csv, start, end, 'host_system_cpu_pct_of_machine'), default=None),
        'k6_cpu_max_pct': max(csv_values(metric_csv, start, end, 'k6_cpu_pct_of_machine'), default=None),
        'unaccounted_cpu_max_pct': max(csv_values(metric_csv, start, end, 'unaccounted_cpu_pct_of_machine'), default=None),
        'extra': summary_extra(root / f'{label}-summary.json'),
        'stages': {},
    }
    for vus, phase_start, phase_end in ((250, started + 20, started + 60), (500, started + 80, started + 120), (1000, start, end)):
        record['stages'][str(vus)] = {
            'rps': counter_rate(metric_csv, phase_start, phase_end, 'http_requests_count'),
            'http_p95_ms': (
                value * 1000 if (value := bucket_p95(
                    root / f'{label}-buckets.csv',
                    'http_server_requests_seconds_bucket', phase_start, phase_end)) is not None else None),
            'pending_max': max(csv_values(metric_csv, phase_start, phase_end, 'hikari_pending'), default=None),
        }
    return record, arrival


def median_dict(records):
    def median_at(key):
        values = [record[key] for record in records if record[key] is not None]
        return statistics.median(values) if values else None
    return {
        'rps': median_at('rps'), 'achievement_pct': median_at('achievement_pct'),
        'arrival': {k: statistics.median([record['arrival'][k] for record in records if record['arrival'][k] is not None])
                    for k in ('max_rps', 'mean_rps', 'stddev_rps')},
        'http_ms': {k: statistics.median([record['http_ms'][k] for record in records if record['http_ms'][k] is not None]) for k in ('p50','p95','p99','max')},
        **{k: median_at(k) for k in ('connecting_p95_ms','w_ms_snapshot','acquire_per_request_snapshot','acquire_p95_s','gc_pause_p95_s','pending_max','active_max','system_cpu_max_pct','k6_cpu_max_pct','unaccounted_cpu_max_pct')},
        'extra': {k: statistics.median([record['extra'][k] for record in records]) for k in ('dropped_iterations','iteration_duration_p95_ms')},
        'stages': {str(vus): {key: (statistics.median(values) if (values := [record['stages'][str(vus)][key] for record in records if record['stages'][str(vus)][key] is not None]) else None) for key in ('rps', 'http_p95_ms', 'pending_max')} for vus in (250, 500, 1000)},
    }


def main():
    baseline, baseline_arrival = run('interval-2', 'exp02-interval-2', ROOT / 'exp02')
    runs, arrivals = [], {}
    for number in (1, 2, 3):
        label = f'run-{number}'
        record, arrival = run(label, f'exp02b-jitter-{number}', ROOT / 'exp02b', ROOT / 'exp02b' / f'{label}-arrival.csv')
        runs.append(record)
        arrivals[label] = arrival
    result = {'baseline_exp02': baseline, 'runs': runs, 'median': median_dict(runs)}
    (ROOT / 'exp02b' / 'analysis.json').write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n')
    for label, samples in arrivals.items():
        with (ROOT / 'exp02b' / f'{label}-arrival-analyzed.csv').open('w', newline='') as file:
            writer = csv.writer(file); writer.writerow(('timestamp_epoch', 'rps')); writer.writerows(samples)
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
