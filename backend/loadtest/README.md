# 부하 테스트 실시간 관측 실행 절차

아래 명령은 모두 `backend/` 디렉터리에서 실행한다. 본 측정 중에는 Mac 절전과 Grafana 브라우저 렌더링이 결과를 흔들 수 있으므로 `caffeinate`를 사용하고, 화면 확인을 마치면 Grafana 탭을 닫는다.

## 1. PostgreSQL, Prometheus, Grafana 기동

```bash
docker compose -f ../docker-compose.yml up -d
docker compose -f ../docker-compose.yml ps
```

Prometheus는 macOS Docker의 `host.docker.internal:8080/actuator/prometheus`를 1초마다 스크레이프한다. `http://localhost:9090/targets`에서 `katsurank-app`, `katsurank-host`가 모두 `UP`인지 확인한다.

## 2. 애플리케이션 기동

최초 1회, 로컬 설정 파일이 없다면 비밀값이 없는 예제에서 복사한다.

```bash
cp src/main/resources/application-local.example.yml \
  src/main/resources/application-local.yml
```

터미널 A에서 실행한다. GC와 전체 애플리케이션 로그를 결과 파일로 남긴다.

```bash
mkdir -p loadtest/results/logs
JAVA_TOOL_OPTIONS='-Xlog:gc*,safepoint:file=loadtest/results/logs/gc.log:time,uptime,level,tags:filecount=5,filesize=20M' \
  ./gradlew bootRun --args='--spring.profiles.active=local' \
  2>&1 | tee loadtest/results/logs/application.log
```

다른 터미널에서 준비 상태를 확인한다.

```bash
curl -fsS http://localhost:8080/actuator/health
curl -fsS http://localhost:8080/actuator/prometheus | rg '^jvm_gc_pause_seconds_bucket' | head
```

## 3. 호스트 메트릭 브리지와 CSV 수집기 기동

터미널 B에서 Prometheus가 읽을 호스트 메트릭 HTTP 엔드포인트를 연다.

```bash
python3 loadtest/observability/serve_host_metrics.py \
  --file loadtest/results/host_metrics.prom \
  --port 9105
```

Grafana 주소:

```text
http://localhost:3000/d/katsurank-load-observability/katsurank-load-test-e28094-cause-trace
```

대시보드 이름은 `Katsurank Load Test — Cause Trace`다. 익명 Viewer로 열리며 다크 테마가 기본이다. pending과 unaccounted CPU를 함께 확인한 뒤 정밀 측정 직전에는 브라우저 탭을 닫는다.

## 4. k6와 CSV 수집기 실행

아래는 500 VU·30초 폴링·60초 **관측 검증** 명령이다. 본 EXP 스크립트로 바꿀 때도 remote-write 환경변수와 collector 동시 실행 구조는 유지한다.

```bash
caffeinate -dimsu /bin/zsh -lc "
K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
K6_PROMETHEUS_RW_TREND_STATS='p(50),p(95),p(99),max' \
K6_PROMETHEUS_RW_STALE_MARKERS=true \
k6 run --out experimental-prometheus-rw \
  --tag testid=observability-validation \
  --summary-export loadtest/results/grafana-validation-summary.json \
  loadtest/verify_observability_500vu.js \
  > loadtest/results/grafana-validation-k6.txt 2>&1 &
k6_process_id=\$!

K6_PID=\$k6_process_id \
MAX_DURATION_SECONDS=75 \
INTERVAL_SECONDS=1 \
PROCESS_SCAN_INTERVAL_SECONDS=5 \
OUTPUT_FILE=loadtest/results/grafana-validation-collector.csv \
HOST_METRICS_FILE=loadtest/results/host_metrics.prom \
loadtest/collect_metrics.sh

wait \$k6_process_id
"
```

k6 v2.0.0에서는 output 이름이 `experimental-prometheus-rw`다. `prometheus-rw`는 유효하지 않다. 기본 라벨 외에 `testid`, `scenario`, `load_stage`, `target_vus`, `session_mode`, HTTP `name`, `status`, `method`, `url`이 붙는다.

## 5. 대시보드에서 볼 순서

1. VU와 목표/실제 RPS가 같은 시각에 움직이는지 확인한다.
2. 서버 랭킹 URI p50/p95/p99와 k6 p95의 간극을 확인한다.
3. Hikari pending과 acquire/usage p95를 확인한다.
4. 바로 아래 CPU 행에서 system/JVM/k6/unaccounted가 같은 시점에 변했는지 확인한다.
5. heap과 GC pause p95가 지연 시점과 겹치는지 확인한다.

블로그용 스크린샷은 `30_결과/스크린샷/YYYY-MM-DD_EXP-번호_설명.png` 규칙으로 저장한다.

## 6. 종료 및 정리

각 foreground 프로세스는 해당 터미널에서 `Ctrl-C`로 종료한다. 관측 컨테이너만 멈추고 데이터 볼륨은 보존하려면:

```bash
docker compose -f ../docker-compose.yml stop prometheus grafana
```

PostgreSQL까지 모두 멈추려면:

```bash
docker compose -f ../docker-compose.yml stop
```

볼륨 삭제가 필요한 `down -v`는 기존 PostgreSQL 데이터까지 제거하므로 사용하지 않는다.
