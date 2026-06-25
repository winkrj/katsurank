export const queryKeys = {
  restaurants: {
    all: ['restaurants'] as const,
    lists: () => [...queryKeys.restaurants.all, 'list'] as const,
    list: (params?: Record<string, string | undefined>) =>
      [...queryKeys.restaurants.lists(), params] as const,
    details: () => [...queryKeys.restaurants.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.restaurants.details(), id] as const,
    search: (q: string) => [...queryKeys.restaurants.all, 'search', q] as const,
  },
  votes: {
    all: ['votes'] as const,
  },
} as const
