export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  restaurants: {
    all: ['restaurants'] as const,
    detail: (id: number) => ['restaurants', 'detail', id] as const,
    search: (q: string) => ['restaurants', 'search', q] as const,
  },
  ranking: {
    all: ['ranking'] as const,
    list: (limit: number, offset: number) => ['ranking', 'list', limit, offset] as const,
    top: ['ranking', 'top'] as const,
    mapPins: ['ranking', 'map-pins'] as const,
  },
  me: {
    all: ['me'] as const,
    profile: ['me', 'profile'] as const,
    voteHistory: ['me', 'vote-history'] as const,
  },
} as const
