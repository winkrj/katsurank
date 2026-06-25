import { useQuery } from '@tanstack/react-query'
import { fetchRestaurants, searchRestaurants } from '../api/restaurants'
import type { RestaurantListParams } from '../types/restaurant'
import { queryKeys } from './queryKeys'

export function useRestaurantsQuery(params?: RestaurantListParams) {
  return useQuery({
    queryKey: queryKeys.restaurants.list(params),
    queryFn: () => fetchRestaurants(params),
  })
}

export function useRestaurantSearchQuery(query: string) {
  return useQuery({
    queryKey: queryKeys.restaurants.search(query),
    queryFn: () => searchRestaurants(query),
    enabled: query.trim().length > 0,
  })
}
