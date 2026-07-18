export type Paginated<T, K extends string = 'items'> = {
  total: number
  offset: number
  limit: number
} & Record<K, T[]>
