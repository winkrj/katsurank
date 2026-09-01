import { check, sleep } from 'k6';
import exec from 'k6/execution';
import http from 'k6/http';
import { Gauge } from 'k6/metrics';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const RANKING_URL = `${BASE_URL}/api/v1/ranking?offset=0&limit=20`;
const INTERVAL_SECONDS = Number(__ENV.INTERVAL || '2');
const SESSION_MODE = (__ENV.SESSION_MODE || 'anonymous').toLowerCase();
const SESSION_COOKIE = __ENV.SESSION_COOKIE || '';
const targetRps = new Gauge('target_rps');

const STAGES = [
  { duration: '20s', target: 250 },
  { duration: '40s', target: 250 },
  { duration: '20s', target: 500 },
  { duration: '40s', target: 500 },
  { duration: '20s', target: 1000 },
  { duration: '60s', target: 1000 },
];

const STAGE_TIMELINE = [
  { untilMs: 20_000, phase: 'ramp', targetVus: '250' },
  { untilMs: 60_000, phase: 'hold', targetVus: '250' },
  { untilMs: 80_000, phase: 'ramp', targetVus: '500' },
  { untilMs: 120_000, phase: 'hold', targetVus: '500' },
  { untilMs: 140_000, phase: 'ramp', targetVus: '1000' },
  { untilMs: Number.POSITIVE_INFINITY, phase: 'hold', targetVus: '1000' },
];

if (!Number.isFinite(INTERVAL_SECONDS) || INTERVAL_SECONDS <= 0) {
  throw new Error('INTERVAL은 0보다 큰 초 단위 숫자여야 한다.');
}

if (!['anonymous', 'session'].includes(SESSION_MODE)) {
  throw new Error('SESSION_MODE는 anonymous 또는 session이어야 한다.');
}

if (SESSION_MODE === 'session' && SESSION_COOKIE.length === 0) {
  throw new Error('SESSION_MODE=session이면 SESSION_COOKIE에 SESSION 쿠키 값이 필요하다.');
}

export const options = {
  discardResponseBodies: true,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  scenarios: {
    polling: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: STAGES,
    },
  },
};

function currentStage() {
  const elapsedMs = exec.instance.currentTestRunDuration;
  return STAGE_TIMELINE.find((stage) => elapsedMs < stage.untilMs);
}

function requestParameters(stage) {
  const jar = http.cookieJar();
  jar.clear(BASE_URL);

  const tags = {
    name: 'GET /api/v1/ranking',
    load_stage: `${stage.phase}_${stage.targetVus}`,
    target_vus: stage.targetVus,
    session_mode: SESSION_MODE,
  };

  const parameters = { redirects: 0, tags };
  if (SESSION_MODE === 'session') {
    parameters.cookies = { SESSION: SESSION_COOKIE };
  }
  return parameters;
}

export default function () {
  const iterationStartedAt = Date.now();
  const stage = currentStage();
  const tags = {
    load_stage: `${stage.phase}_${stage.targetVus}`,
    target_vus: stage.targetVus,
    session_mode: SESSION_MODE,
  };

  targetRps.add(Number(stage.targetVus) / INTERVAL_SECONDS, tags);
  const response = http.get(RANKING_URL, requestParameters(stage));
  check(response, { 'ranking status is 200': (result) => result.status === 200 }, tags);

  const elapsedSeconds = (Date.now() - iterationStartedAt) / 1000;
  sleep(Math.max(0, INTERVAL_SECONDS - elapsedSeconds));
}
