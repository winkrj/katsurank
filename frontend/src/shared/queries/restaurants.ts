import { useQuery } from '@tanstack/react-query'
import { fetchRestaurant, searchRestaurants } from '../api/restaurants'
import { queryKeys } from './queryKeys'

export function useRestaurantQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.restaurants.detail(id),
    queryFn: () => fetchRestaurant(id),
  })
}

export function useRestaurantSearchQuery(q: string, limit?: number) {
  return useQuery({
    queryKey: queryKeys.restaurants.search(q),
    queryFn: () => searchRestaurants(q, limit),
    enabled: q.trim().length > 0,
  })
}
