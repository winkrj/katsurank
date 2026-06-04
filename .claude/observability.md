---
paths:
  - "src/main/java/com/katsurank/common/**"
  - "src/main/resources/logback-spring.xml"
  - "src/main/resources/application*.yml"
---

# 관측(Observability) 규칙

방침: 기능은 MVP로 얇게, **관측은 처음부터 두껍게.** 상세는 `docs/03_data_model_and_tech_v0.2.md` 7섹션.

## Day 1 필수 (나중에 넣기 비싼 것)

- 구조화 로깅: JSON 출력 (`logstash-logback-encoder`).
- 요청 추적 ID(traceId)를 MDC에 심기 — 필터에서 요청 단위로 생성/주입.
- 핵심 비즈니스 이벤트 명시적 로그: 투표 · 표 이동 · 가게 등록 · 카카오 API 호출/실패.
- Spring Boot Actuator + Micrometer. `/actuator/health`, `/actuator/metrics`, Prometheus 포맷 노출.
- 커스텀 메트릭: 투표 수, 표 이동 횟수, 활성 사용자, 카카오 API 응답시간/실패율, 락 충돌 횟수.

## 출시 전 추가 (나중에 붙여도 싼 것)

- Sentry 무료 티어 (예외 자동 수집).
- Grafana Cloud 무료 티어 연결.

## 안 하는 것

- 유료 APM, 직접 운영 ELK, 분산 트레이싱 풀세팅 (트래픽 생긴 뒤 검토).
