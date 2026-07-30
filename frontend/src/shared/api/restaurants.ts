import { apiClient } from './client'
import type {
  RestaurantResponse,
  RestaurantSearchResponse,
  RestaurantRegisterRequest,
  CloseResponse,
  RelocateRequest,
  RelocateResponse,
} from '../types/restaurant'
import type { Paginated } from '../types/common'

export function fetchRestaurant(id: number) {
  return apiClient<RestaurantResponse>(`/api/v1/restaurants/${id}`)
}

export function searchRestaurants(q: string, limit = 10, offset = 0) {
  const params = new URLSearchParams({ q, limit: String(limit), offset: String(offset) })
  return apiClient<Paginated<RestaurantSearchResponse>>(`/api/v1/restaurants/search?${params}`)
}

export function registerRestaurant(body: RestaurantRegisterRequest) {
  return apiClient<RestaurantResponse>('/api/v1/restaurants', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function closeRestaurant(id: number) {
  return apiClient<CloseResponse>(`/api/v1/restaurants/${id}/close`, {
    method: 'PATCH',
  })
}

export function relocateRestaurant(id: number, body: RelocateRequest) {
  return apiClient<RelocateResponse>(`/api/v1/restaurants/${id}/relocate`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}
