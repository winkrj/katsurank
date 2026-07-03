import { apiClient } from './client'
import type { RankingItem, MapPinResponse } from '../types/ranking'

export function fetchRanking(limit = 20, offset = 0) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  return apiClient<RankingItem[]>(`/api/v1/ranking?${params}`)
}

export function fetchRankingTop() {
  return apiClient<RankingItem[]>('/api/v1/ranking/top')
}

export function fetchMapPins() {
  return apiClient<MapPinResponse[]>('/api/v1/ranking/map-pins')
}
