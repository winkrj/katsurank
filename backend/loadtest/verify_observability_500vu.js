import { pollRanking } from './polling_common.js';

export const options = {
  discardResponseBodies: true,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  scenarios: {
    observability_validation: {
      executor: 'constant-vus',
      vus: 500,
      duration: '60s',
      gracefulStop: '5s',
    },
  },
};

export default function () {
  pollRanking(30, 500);
}
