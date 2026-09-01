#!/usr/bin/env python3
import csv, json, os, statistics, sys
from datetime import datetime
from pathlib import Path
from analyze_exp02b import bucket_p95, csv_values

ROOT = Path(os.environ.get('EXP04_ROOT', 'loadtest/results/exp04'))
TARGETS = (500, 1000, 2000, 5000, 10000)

def milliseconds(value): return value * 1000 if value is not None else None

def epoch(path): return int(datetime.strptime(path.read_text().strip(), '%Y-%m-%dT%H:%M:%S%z').timestamp())
def counter_rates(path, start, end, column):
    rows=list(csv.DictReader(path.open())); out=[]; prev=None
    for row in rows:
        t=int(row['timestamp_epoch']); v=row.get(column)
        if v:
            absolute=float(v)
            if prev and start < t <= end and t-prev[0] <= 2: out.append((absolute-prev[1])/(t-prev[0]))
            prev=(t,absolute)
    return out
def network_rates(path,start,end):
    rows=list(csv.DictReader(path.open())); out=[]; prev=None
    for row in rows:
        t=int(row['timestamp_epoch']); v=float(row['obytes'])
        if prev and start < t <= end and t-prev[0] <=2: out.append((v-prev[1])/(t-prev[0]))
        prev=(t,v)
    return out
def main(run):
    label=f'run-{run}'; started=epoch(ROOT/f'{label}-started-kst.txt'); metrics=ROOT/f'{label}-metrics.csv'; arrival=ROOT/f'{label}-arrival.csv'; network=ROOT/f'{label}-network.csv'; buckets=ROOT/f'{label}-buckets.csv'
    stages=[]
    for i,target in enumerate(TARGETS):
        start=started+20+i*80; end=start+60; rates=counter_rates(arrival,start,end,'http_ranking_requests_count'); net=network_rates(network,start,end)
        stages.append({'target_rps':target,'actual_rps_mean':statistics.mean(rates) if rates else None,'actual_rps_max':max(rates,default=None),'http_p95_ms':milliseconds(bucket_p95(buckets,'http_server_requests_seconds_bucket',start,end)),'acquire_p95_ms':milliseconds(bucket_p95(buckets,'hikaricp_connections_acquire_seconds_bucket',start,end)),'gc_p95_ms':milliseconds(bucket_p95(buckets,'jvm_gc_pause_seconds_bucket',start,end)),'system_cpu_max_pct':max(csv_values(metrics,start,end,'host_system_cpu_pct_of_machine'),default=None),'jvm_cpu_max_pct':max(csv_values(metrics,start,end,'process_cpu_pct_of_machine'),default=None),'k6_cpu_max_pct':max(csv_values(metrics,start,end,'k6_cpu_pct_of_machine'),default=None),'k6_rss_max_kib':max(csv_values(metrics,start,end,'k6_rss_kib'),default=None),'heap_max_bytes':max(csv_values(metrics,start,end,'jvm_memory_used_bytes'),default=None),'pending_max':max(csv_values(metrics,start,end,'hikari_pending'),default=None),'active_max':max(csv_values(metrics,start,end,'hikari_active'),default=None),'lo0_egress_mean_bps':statistics.mean(net) if net else None,'lo0_egress_max_bps':max(net,default=None)})
    (ROOT/f'{label}-analysis.json').write_text(json.dumps({'stages':stages},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'stages':stages},ensure_ascii=False,indent=2))
if __name__=='__main__': main(int(sys.argv[1]))
