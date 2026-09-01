import { check, sleep } from 'k6';
import exec from 'k6/execution';
import http from 'k6/http';
import { Gauge } from 'k6/metrics';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const URL = `${BASE_URL}/api/v1/ranking?offset=0&limit=20`;
const VUS = 1000;
const targetRps = new Gauge('target_rps');
let jittered = false;
const STEPS = [500, 1000, 2000, 5000, 10000];
const RAMP_SECONDS = 20;
const HOLD_SECONDS = 60;

export const options = {
  discardResponseBodies: true,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  scenarios: { polling: { executor: 'constant-vus', vus: VUS, duration: `${STEPS.length * (RAMP_SECONDS + HOLD_SECONDS)}s` } },
};

function stageAt(seconds) {
  const slot = Math.min(Math.floor(seconds / (RAMP_SECONDS + HOLD_SECONDS)), STEPS.length - 1);
  const within = seconds - slot * (RAMP_SECONDS + HOLD_SECONDS);
  const previous = slot === 0 ? 0 : STEPS[slot - 1];
  const target = within < RAMP_SECONDS ? previous + (STEPS[slot] - previous) * within / RAMP_SECONDS : STEPS[slot];
  return { slot, target, phase: within < RAMP_SECONDS ? 'ramp' : 'hold' };
}

export default function () {
  if (!jittered) { sleep(Math.random() * 2); jittered = true; }
  const started = Date.now();
  const stage = stageAt(exec.instance.currentTestRunDuration / 1000);
  const interval = VUS / Math.max(stage.target, 1);
  const tags = { name: 'GET /api/v1/ranking', rps_stage: String(STEPS[stage.slot]), load_phase: stage.phase };
  targetRps.add(stage.target, tags);
  const response = http.get(URL, { redirects: 0, tags });
  check(response, { 'ranking status is 200': r => r.status === 200 }, tags);
  sleep(Math.max(0, interval - (Date.now() - started) / 1000));
}
