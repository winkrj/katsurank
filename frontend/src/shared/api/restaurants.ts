import { apiClient } from './client'
import type { RestaurantResponse, RestaurantRegisterRequest, RelocateRequest } from '../types/restaurant'

export function fetchRestaurant(id: number) {
  return apiClient<RestaurantResponse>(`/api/v1/restaurants/${id}`)
}

export function searchRestaurants(q: string, limit = 10) {
  const params = new URLSearchParams({ q, limit: String(limit) })
  return apiClient<RestaurantResponse[]>(`/api/v1/restaurants/search?${params}`)
}

export function registerRestaurant(body: RestaurantRegisterRequest) {
  return apiClient<RestaurantResponse>('/api/v1/restaurants', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function closeRestaurant(id: number) {
  return apiClient<RestaurantResponse>(`/api/v1/restaurants/${id}/close`, {
    method: 'POST',
  })
}

export function relocateRestaurant(id: number, body: RelocateRequest) {
  return apiClient<RestaurantResponse>(`/api/v1/restaurants/${id}/relocate`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}
