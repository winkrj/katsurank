#!/usr/bin/env python3
import csv, sys
from datetime import datetime
from pathlib import Path
from analyze_exp02b import bucket_p95
root = Path(sys.argv[1]); targets = (500, 1000, 2000, 5000, 10000); output = []
for run_dir in sorted((root / "runs").glob("run-*")):
    start = int(datetime.strptime((run_dir / "started-kst.txt").read_text().strip(), "%Y-%m-%dT%H:%M:%S%z").timestamp())
    metrics = list(csv.DictReader((run_dir / "metrics.csv").open())); arrival = list(csv.DictReader((run_dir / "arrival.csv").open()))
    output.append(f"[{run_dir.name}]")
    for i, target in enumerate(targets):
        low, high = start + 20 + i * 80, start + 80 + i * 80
        a = [r for r in arrival if low <= int(r["timestamp_epoch"]) <= high and r["http_ranking_requests_count"]]
        rates = [(float(a[j]["http_ranking_requests_count"])-float(a[j-1]["http_ranking_requests_count"]))/(int(a[j]["timestamp_epoch"])-int(a[j-1]["timestamp_epoch"])) for j in range(1,len(a)) if int(a[j]["timestamp_epoch"])>int(a[j-1]["timestamp_epoch"])]
        m = [r for r in metrics if low <= int(r["timestamp_epoch"]) <= high]
        app=max((float(r["process_cpu_pct_of_machine"]) for r in m if r["process_cpu_pct_of_machine"]),default=0); un=max((float(r["unaccounted_cpu_pct_of_machine"]) for r in m if r["unaccounted_cpu_pct_of_machine"]),default=0)
        p95=bucket_p95(run_dir/"buckets.csv","http_server_requests_seconds_bucket",low,high)
        output.append(f"target={target} actual_rps_mean={sum(rates)/len(rates) if rates else 0:.1f} p95_ms={(p95 or 0)*1000:.1f} app_cpu_max={app:.2f}% unaccounted_cpu_max={un:.2f}%")
(root/"summary-stages.txt").write_text("\n".join(output)+"\n")
