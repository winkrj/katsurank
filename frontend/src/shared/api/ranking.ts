import { apiClient } from './client'
import type { RankingItem, MapPinResponse } from '../types/ranking'
import type { Paginated } from '../types/common'

export function fetchRanking(limit = 20, offset = 0) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  return apiClient<Paginated<RankingItem>>(`/api/v1/ranking?${params}`)
}

// 204면 랭킹에 가게가 하나도 없다는 뜻 — apiClient가 이 경우 undefined를 반환함
export function fetchRankingTop() {
  return apiClient<RankingItem | null>('/api/v1/ranking/top')
}

export function fetchMapPins() {
  return apiClient<MapPinResponse[]>('/api/v1/ranking/map-pins')
}
