import { apiClient } from './client'

export type Restaurant = {
  id: number
  name: string
  address: string
  voteCount: number
}

export type RestaurantListParams = {
  bounds?: string
  sort?: string
}

export function fetchRestaurants(params?: RestaurantListParams) {
  const search = new URLSearchParams()
  if (params?.bounds) search.set('bounds', params.bounds)
  if (params?.sort) search.set('sort', params.sort)
  const query = search.toString()
  return apiClient<Restaurant[]>(`/api/restaurants${query ? `?${query}` : ''}`)
}

export function fetchRestaurant(id: number) {
  return apiClient<Restaurant>(`/api/restaurants/${id}`)
}

export function searchRestaurants(q: string) {
  return apiClient<Restaurant[]>(
    `/api/restaurants/search?q=${encodeURIComponent(q)}`,
  )
}
