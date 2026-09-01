# 카츠랭 랭킹 성능 개선 자료

이 폴더는 같은 TOP 20을 반복해서 조회하던 구조가 캐시와 SSE로 발전한 과정과 그 근거를 보관한다.

## 처음 방문했다면

| 읽을거리 | 대상 | 내용 |
|---|---|---|
| [PERFORMANCE_STORY.md](PERFORMANCE_STORY.md) | 사람·GitHub·블로그 | 문제, 시행착오, 선택을 쉬운 말로 설명 |
| [EXPERIMENT_HISTORY.md](EXPERIMENT_HISTORY.md) | AI·검증·재현 | EXP-01~06 상태, 수치 인용 제한, Git 분류 |
| 이 문서의 아래 절차 | 실험 실행자 | 관측 환경 기동과 재실행 방법 |

원본 결과와 분석기는 자동 검산과 재현을 위해 그대로 유지한다. 사람에게 설명할 때는 EXP 번호보다
`polling 간격 실험`, `지터 실험`, `캐시 검증`, `SSE 연결 검증`처럼 목적을 먼저 표현한다.

> **검증된 기준 환경:** macOS + Docker Desktop + `/bin/zsh` + k6 v2.
> 아래 절차의 `caffeinate`와 `host.docker.internal`은 macOS 기준이며, 다른 OS에서는 절전 방지와
> 호스트 접근 주소를 해당 환경에 맞게 바꿔야 한다.

---

# 부하 테스트 실시간 관측 실행 절차

아래 명령은 모두 `backend/` 디렉터리에서 실행한다. 본 측정 중에는 Mac 절전과 Grafana 브라우저 렌더링이 결과를 흔들 수 있으므로 `caffeinate`를 사용하고, 화면 확인을 마치면 Grafana 탭을 닫는다.

실험의 기술적 완료 상태와 현재 코드에 대한 유효성은 [EXPERIMENT_HISTORY.md](EXPERIMENT_HISTORY.md)를 확인한다.

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
  --host 0.0.0.0 \
  --port 9105
```

기본 바인딩은 `127.0.0.1`이다. 위 실행은 Docker의 Prometheus가
`host.docker.internal:9105`로 접근해야 하므로 측정 중에만 전체 인터페이스 바인딩을 명시한다.

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
