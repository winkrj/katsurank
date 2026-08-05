import { buildOptions, pollRanking } from './polling_common.js';

export const options = buildOptions();

export default function () {
  pollRanking(2);
}
