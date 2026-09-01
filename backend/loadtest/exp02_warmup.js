import { pollRanking } from './polling_common.js';

export const options = {
  discardResponseBodies: true,
  scenarios: {
    warmup: {
      executor: 'constant-vus',
      vus: 10,
      duration: '3m',
    },
  },
};

export default function () {
  pollRanking(2, 10);
}
