# EXP-04 v2 무인 실행 — 중단된 역사 자료

> 상태: **중단(2026-08-09)**. 완료된 성능 결과로 사용하지 않는다.
>
> 가장 진척된 실행 `results/exp04-v2/20260809-160448`은 사전 점검과 워밍업을
> 통과했지만 run-1 뒤 종료됐다. run-2·3과 최종 요약이 없고
> `run_exp04_v2.sh` 원본도 보존되지 않았다.

이 문서는 당시 재현 목표와 중단 조건을 보존하기 위한 기록이다. 당시 남아 있던 0바이트 실행기를
추측으로 복원하지 않았으며, 현재 runner는 오인 실행을 막는 안내문만 출력한다. 재실험이 필요하면
기존 결과를 덮어쓰지 않는 새 EXP 번호로 설계한다.

## 당시 계획

1. IntelliJ 종료
2. 브라우저 종료
3. Slack 종료
4. 터미널에서 실행: `caffeinate -i ./loadtest/run_exp04_v2.sh`
5. 자리 비움 (예상 약 34분)
6. 완료 후 IntelliJ를 다시 실행하고 loadtest/results/exp04-v2/<타임스탬프>/ 전체를 Codex에 전달한다.

## 사전 점검 중단 조건

- IntelliJ, 브라우저, Slack 실행
- CPU 5% 이상 Spotlight worker
- Time Machine 백업 진행
- 1분 load average 1.0 이상
- PostgreSQL, Prometheus(9090), host metrics(9105) 헬스체크 실패
- 디스크 여유 10GiB 미만
- 8080 포트 점유

자동 종료나 사람 입력은 하지 않는다.

## 계획했던 결과 구조

<timestamp>/
  runner.log, preflight-*.txt, runtime-virtual-thread-scheduler.txt
  response-body.json, response-headers-*.txt, response-size-summary.txt
  warmup-*.json|txt
  logs/application.log, logs/gc.log*
  runs/run-{1,2,3}/
    k6.txt, summary.json, metrics.csv, processes.csv, buckets.csv, arrival.csv
    before-prometheus.txt, after-prometheus.txt, collector.log, arrival.log
  summary.txt

processes.csv는 상위 20개 프로세스 CPU/RSS를 머신 기준으로 정규화한다. metrics.csv에는 unaccounted_cpu_pct_of_machine과 수집기 CPU/RSS가 있다.

## 실제 남은 결과

- 여러 초기 시도는 사전 점검 단계에서 중단됐다.
- `20260809-160448`은 run-1 k6 출력까지 존재하지만 runner는 `run-1 시작`에서 끝난다.
- run-1의 `after-prometheus.txt`는 비어 있다.
- run-2·3 및 `summary.txt`/`summary-stages.txt`는 없다.

따라서 EXP-04 v1의 3회 결과와 혼합하거나, EXP-04 v2가 완료됐다고 인용하면 안 된다.
