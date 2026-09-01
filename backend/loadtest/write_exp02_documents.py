#!/usr/bin/env python3
import json
import re
from pathlib import Path

LAB = Path('/Users/hongseungjun/memo/04_Projects/Katsurank/부하테스트')
DOC = LAB / '10_실험/EXP-02_2초폴링_그냥.md'
TROUBLE = LAB / '20_삽질로그/2026-08-09_EXP-02_기동전_GC로그_부재.md'
ROOT = Path('loadtest/results/exp02')
data = json.loads((ROOT / 'analysis.json').read_text())

def f(value, digits=1, suffix=''):
    return '[미측정]' if value is None else f'{value:.{digits}f}{suffix}'

def row(label):
    return data[label]

a, b, c, repeat = (row('interval-30-first'), row('interval-2'), row('interval-1'), row('interval-30-repeat'))

def cell(metric, digits=1, suffix=''):
    return ' | '.join(f(row(label)[metric], digits, suffix) for label in ('interval-30-first', 'interval-2', 'interval-1'))

def duration_cell():
    return ' | '.join(
        f'{row(label)["http_ms"]["p50"]:.1f} / {row(label)["http_ms"]["p95"]:.1f} / {row(label)["http_ms"]["p99"]:.1f} ms'
        for label in ('interval-30-first', 'interval-2', 'interval-1')
    )

def raw(label):
    return (ROOT / f'{label}-k6.txt').read_text().strip()

method = f'''## 2. 측정 방법

- 측정일: 2026-08-09 KST. 앱(PID 91072)은 측정 전부터 이미 기동돼 있었으므로 **재시작하지 않았다**. JIT 컴파일과 pgJDBC PreparedStatement 캐시의 워밍업 상태를 실행별로 초기화하지 않기 위해서다.
- 다만 기존 기동 시점의 GC 파일 로그와 `caffeinate` 사용은 확인할 수 없었다. 재시작 금지 조건을 우선해 프로세스는 유지하고, 측정 시작 전부터 `caffeinate -dimsu -w 91072`를 연결했다. 이 제약은 [[2026-08-09_EXP-02_기동전_GC로그_부재]]에 분리 기록했다.
- 워밍업: 10 VU, 2초 폴링, 3분. `testid=exp02-warmup`으로 분리해 본 집계에서 제외했다.
- 실행 순서: 30초 → 5분 열 회복 → 2초 → 5분 열 회복 → 1초 → 5분 열 회복 → 30초 재실행. 뒤 실행일수록 JIT·캐시 워밍업이 더 진행되는 **순서 편향 가능성**이 있다. 실제 30초 재실행의 p95가 첫 실행보다 달라 이 편향 또는 시간 경과 중 외부 요인의 영향을 배제할 수 없다.
- 부하: `ramping-vus` 닫힌 모델. 0→250, 250→500, 500→1,000 VU를 각각 20초 램프하고 250/500은 40초, 1,000은 60초 유지했다. 요청에는 `load_stage=ramp_*|hold_*`와 `target_vus` 태그를 붙여 1,000 VU hold만 집계했다.
- 세션 정책: 세 실행 모두 `SESSION_MODE=anonymous`. 요청 직전 cookie jar를 비워 유효한 `SESSION` 쿠키를 보내지 않았다. 따라서 세션 SQL은 발생하지 않는 익명 요청이다.
- 관측: Prometheus·Grafana 컨테이너는 기동 상태였고 브라우저 탭을 열지 않았다. `collect_metrics.sh`는 세 실행 모두 `INTERVAL_SECONDS=1`, `PROCESS_SCAN_INTERVAL_SECONDS=5`로 실행했다. 앱 Actuator를 수동 `watch`로 호출하지 않았다.
- keep-alive 런타임 확인: JMX `Tomcat:type=Connector,port=8080`에서 `connectionTimeout=60000ms`, `keepAliveTimeout=60000ms`를 확인했다. 따라서 30초 폴링이 Tomcat 기본 20초를 넘어 재연결된다는 가설의 전제는 이 실행에서 성립하지 않는다.
- 각 실행 직전·직후 `/actuator/prometheus`를 파일로 저장했다. Hikari usage/acquire count·sum의 차분으로 W와 요청당 획득 수를 계산했다. `http_req_connecting`은 k6 remote-write 시계열에서 hold_1000만 분리했다.

실행 명령은 `loadtest/run_exp02_poll_compare.sh`에 남겼다. 스크립트는 매 실행마다 시작·종료 시각, Prometheus 전후 스냅샷, k6 원본 출력, 요약 JSON, CSV·bucket·프로세스 CSV를 `loadtest/results/exp02/`에 남긴다.

---

'''

results = f'''## 3. 실측 결과

### 1,000 VU 유지 구간

단위는 별도 표기가 없으면 ms 또는 %다. 실제 RPS는 `hold_1000` 태그의 `k6_http_reqs_total` 최종값 ÷ 60초다. W와 획득/요청은 각 실행 전후 Hikari Timer 누적값 차분이라 전체 실행 구간 기준이다.

| 지표 | 30초 | 2초 | 1초 |
|---|---:|---:|---:|
| 목표 RPS | 33.3 | 500.0 | 1,000.0 |
| 실제 RPS | {a['hold_rps']:.1f} | {b['hold_rps']:.1f} | {c['hold_rps']:.1f} |
| 목표 대비 달성률 | {a['hold_rps'] / (1000 / 30) * 100:.1f}% | {b['hold_rps'] / 500 * 100:.1f}% | {c['hold_rps'] / 1000 * 100:.1f}% |
| p50 / p95 / p99 | {duration_cell()} |
| max | {a['http_ms']['max']:.1f} | {b['http_ms']['max']:.1f} | {c['http_ms']['max']:.1f} |
| 실패율 | 0.0% | 0.0% | 0.0% |
| W (usage sum ÷ count) | {a['w_ms_full_run_snapshot_delta']:.2f} | {b['w_ms_full_run_snapshot_delta']:.2f} | {c['w_ms_full_run_snapshot_delta']:.2f} |
| 커넥션 획득 / 요청 | {a['acquire_per_request_full_run_snapshot_delta']:.2f} | {b['acquire_per_request_full_run_snapshot_delta']:.2f} | {c['acquire_per_request_full_run_snapshot_delta']:.2f} |
| acquire p95 | {a['acquire_p95_seconds_hold'] * 1000:.1f} | {b['acquire_p95_seconds_hold'] * 1000:.1f} | {c['acquire_p95_seconds_hold'] * 1000:.1f} |
| pending 최대 | {a['pending_max_hold']:.0f} | {b['pending_max_hold']:.0f} | {c['pending_max_hold']:.0f} |
| active 최대 | {a['active_max_hold']:.0f} | {b['active_max_hold']:.0f} | {c['active_max_hold']:.0f} |
| http_req_connecting p95 | {a['connecting_ms']:.1f} | {b['connecting_ms']:.1f} | {c['connecting_ms']:.1f} |
| system CPU 최대 | {a['system_cpu_max_hold_pct']:.1f}% | {b['system_cpu_max_hold_pct']:.1f}% | {c['system_cpu_max_hold_pct']:.1f}% |
| k6 CPU 최대 (8코어 환산) | {a['k6_cpu_max_hold_pct']:.2f}% | {b['k6_cpu_max_hold_pct']:.2f}% | {c['k6_cpu_max_hold_pct']:.2f}% |
| GC pause p95 | [미측정: hold 내 GC bucket 차분 0건] | [미측정: hold 내 GC bucket 차분 0건] | [미측정: hold 내 GC bucket 차분 0건] |
| unaccounted CPU 최대 | {a['unaccounted_cpu_max_hold_pct']:.2f}% | {b['unaccounted_cpu_max_hold_pct']:.2f}% | {c['unaccounted_cpu_max_hold_pct']:.2f}% |

`dropped_iterations`는 `ramping-vus` 닫힌 모델 요약에 생성되지 않았다. 1,000 VU 도달 여부는 `vus_max=1,000`으로 확인했다. k6 CPU는 1초 조건도 최대 4.56%(8코어 환산)라 생성기 CPU 포화 근거는 없다. 다만 1초 조건의 `iteration_duration` p95는 3,410.6ms(전체 실행 요약)로 폴링 주기 1초를 초과했으며, 이 때문에 VU가 다음 iteration을 시작하지 못하는 조정된 누락이 발생했다.

### 계단별 pending 관측

| 조건 | 250 VU hold pending 최대 | 500 VU 구간 pending 최대 | 1,000 VU hold pending 최대 |
|---|---:|---:|---:|
| 30초 | 0 | 0 | 0 |
| 2초 | 0 | 1 (hold_500) | 951 |
| 1초 | 0 | 470 (ramp_500) | 981 |

첫 pending은 2초 폴링의 500 VU hold에서 1로 관측됐다. 1초 폴링은 500 VU 램프에서 이미 470까지 증가했다.

### 순서 편향 확인용 30초 재실행

| 실행 | 실제 RPS | p50 / p95 / p99 | max | W | pending 최대 | http_req_connecting p95 |
|---|---:|---:|---:|---:|---:|---:|
| 첫 30초 | {a['hold_rps']:.1f} | {a['http_ms']['p50']:.1f} / {a['http_ms']['p95']:.1f} / {a['http_ms']['p99']:.1f} | {a['http_ms']['max']:.1f} | {a['w_ms_full_run_snapshot_delta']:.2f} | 0 | 0.0 |
| 마지막 30초 | {repeat['hold_rps']:.1f} | {repeat['http_ms']['p50']:.1f} / {repeat['http_ms']['p95']:.1f} / {repeat['http_ms']['p99']:.1f} | {repeat['http_ms']['max']:.1f} | {repeat['w_ms_full_run_snapshot_delta']:.2f} | 0 | 0.0 |

두 30초 실행의 실제 RPS는 거의 같지만 p95는 22.5ms → 144.2ms로 달랐다. 따라서 30→2→1 순서의 결과에는 워밍업·시간 경과 또는 공존 프로세스 변화에 따른 편향 가능성이 있으며, 본 기록은 **각 조건 1회 측정**이다. 재현 확인이 필요하다.

### k6 원본 출력

본문에는 결과 해석에 필요한 요약만 남기고, 전체 원본은 아래 파일에 보존했다.

- [[30_결과/원본/EXP-02/INTERVAL=30_첫실행_k6]]
- [[30_결과/원본/EXP-02/INTERVAL=2_k6]]
- [[30_결과/원본/EXP-02/INTERVAL=1_k6]]
- [[30_결과/원본/EXP-02/INTERVAL=30_재실행_k6]]

'''

doc = DOC.read_text()
doc = re.sub(r'- 상태: .*', '- 상태: 완료', doc, count=1)
doc = re.sub(r'- 측정일:.*', '- 측정일: 2026-08-09 KST', doc, count=1)
doc = re.sub(r'## 2\. 측정 방법.*?(?=## 4\. 가설 vs 실제)', method + results, doc, flags=re.S)
if '## 1. 가설' not in doc or '## 4. 가설 vs 실제' not in doc:
    raise SystemExit('보호 구간을 찾지 못해 문서 쓰기를 중단했다.')
DOC.write_text(doc)

TROUBLE.write_text('''---
type: note
status: resolved
area: backend
project: Katsurank
tags: [backend, performance, loadtest, exp02]
created: 2026-08-09
---

# EXP-02 기동 전 GC 로그 부재

## 증상

EXP-02 시작 시 앱 PID 91072가 이미 약 47분 전에 기동돼 있었다. 프로세스 표준 출력의 GC 파일 로그 설정과 기동 시 `caffeinate` 사용은 확인할 수 없었다.

## 판단

요구 조건은 앱을 한 번만 기동하고 재시작하지 않는 것이었다. GC 파일 로그를 새로 얻기 위해 재시작하면 JIT와 pgJDBC PreparedStatement 캐시가 초기화돼 세 실행 조건이 달라진다. 따라서 재시작하지 않았다.

## 조치와 영향

측정 시작 전 `caffeinate -dimsu -w 91072`를 연결했고, Micrometer `jvm_gc_pause` bucket과 `collect_metrics.sh`는 수집했다. hold 구간의 GC bucket 차분은 0건이어서 GC pause p95는 산출하지 않았다. 기동 시점부터의 GC 파일 로그는 이번 시행에 없다. 다음 재현 측정에서는 앱 최초 기동 명령에 `caffeinate`와 `-Xlog:gc*,safepoint:file=...`를 함께 넣어야 한다.
''')
