import { check, sleep } from 'k6';
import exec from 'k6/execution';
import http from 'k6/http';
import { Gauge } from 'k6/metrics';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const RANKING_URL = `${BASE_URL}/api/v1/ranking?offset=0&limit=20`;
const SESSION_MODE = (__ENV.SESSION_MODE || 'anonymous').toLowerCase();
const SESSION_COOKIE = __ENV.SESSION_COOKIE || '';
const isHttps = BASE_URL.startsWith('https://');
const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/.test(BASE_URL);
let initialPollJitterApplied = false;
const targetRps = new Gauge('target_rps');

const LOAD_STAGES = [
  { duration: '10s', target: 100 },
  { duration: '60s', target: 100 },
  { duration: '10s', target: 250 },
  { duration: '60s', target: 250 },
  { duration: '10s', target: 500 },
  { duration: '60s', target: 500 },
  { duration: '10s', target: 1000 },
  { duration: '60s', target: 1000 },
  { duration: '10s', target: 2000 },
  { duration: '60s', target: 2000 },
  { duration: '10s', target: 4000 },
  { duration: '60s', target: 4000 },
  { duration: '10s', target: 0 },
];

const STAGE_TIMELINE = [
  { untilMs: 10_000, targetVus: '100', phase: 'ramp' },
  { untilMs: 70_000, targetVus: '100', phase: 'hold' },
  { untilMs: 80_000, targetVus: '250', phase: 'ramp' },
  { untilMs: 140_000, targetVus: '250', phase: 'hold' },
  { untilMs: 150_000, targetVus: '500', phase: 'ramp' },
  { untilMs: 210_000, targetVus: '500', phase: 'hold' },
  { untilMs: 220_000, targetVus: '1000', phase: 'ramp' },
  { untilMs: 280_000, targetVus: '1000', phase: 'hold' },
  { untilMs: 290_000, targetVus: '2000', phase: 'ramp' },
  { untilMs: 350_000, targetVus: '2000', phase: 'hold' },
  { untilMs: 360_000, targetVus: '4000', phase: 'ramp' },
  { untilMs: 420_000, targetVus: '4000', phase: 'hold' },
  { untilMs: Number.POSITIVE_INFINITY, targetVus: '0', phase: 'ramp_down' },
];

if (!['anonymous', 'session'].includes(SESSION_MODE)) {
  throw new Error('SESSION_MODE는 anonymous 또는 session이어야 한다.');
}

if (SESSION_MODE === 'session' && SESSION_COOKIE.length === 0) {
  throw new Error('SESSION_MODE=session이면 SESSION_COOKIE에 SESSION 쿠키 값이 필요하다.');
}

if (SESSION_MODE === 'session' && !isHttps && !isLocalhost) {
  throw new Error('SESSION_MODE=session은 HTTPS 또는 localhost에서만 사용할 수 있다.');
}

export function buildOptions() {
  return {
    discardResponseBodies: true,
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
    scenarios: {
      polling: {
        executor: 'ramping-vus',
        startVUs: 0,
        stages: LOAD_STAGES,
        gracefulRampDown: '10s',
      },
    },
  };
}

function currentStage() {
  const elapsedMs = exec.instance.currentTestRunDuration;
  return STAGE_TIMELINE.find((stage) => elapsedMs < stage.untilMs);
}

function requestParameters(stage) {
  const jar = http.cookieJar();
  jar.clear(BASE_URL);

  const parameters = {
    redirects: 0,
    tags: {
      name: 'GET /api/v1/ranking',
      load_stage: `${stage.phase}_${stage.targetVus}`,
      target_vus: stage.targetVus,
      session_mode: SESSION_MODE,
    },
  };

  if (SESSION_MODE === 'session') {
    parameters.cookies = {
      SESSION: SESSION_COOKIE,
    };
  }

  return parameters;
}

export function pollRanking(pollSeconds, fixedTargetVus = null) {
  if (!initialPollJitterApplied) {
    sleep(Math.random() * pollSeconds);
    initialPollJitterApplied = true;
  }

  const iterationStartedAt = Date.now();
  const stage = fixedTargetVus === null
    ? currentStage()
    : { targetVus: String(fixedTargetVus), phase: 'validation' };
  targetRps.add(Number(stage.targetVus) / pollSeconds, {
    load_stage: `${stage.phase}_${stage.targetVus}`,
    target_vus: stage.targetVus,
    session_mode: SESSION_MODE,
  });
  const response = http.get(RANKING_URL, requestParameters(stage));

  check(response, {
    'ranking status is 200': (result) => result.status === 200,
  }, {
    load_stage: `${stage.phase}_${stage.targetVus}`,
    target_vus: stage.targetVus,
    session_mode: SESSION_MODE,
  });

  const elapsedSeconds = (Date.now() - iterationStartedAt) / 1000;
  sleep(Math.max(0, pollSeconds - elapsedSeconds));
}
