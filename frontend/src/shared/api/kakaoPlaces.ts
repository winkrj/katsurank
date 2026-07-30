import { apiClient } from './client'
import type { Paginated } from '../types/common'

export type KakaoPlaceDto = {
  kakaoPlaceId: string
  name: string
  address: string
  roadAddress: string
  latitude: number
  longitude: number
  category: string
  phone: string
  placeUrl: string
}

export function searchKakaoPlacesProxy(query: string, offset = 0, limit = 15) {
  const params = new URLSearchParams({ query, offset: String(offset), limit: String(limit) })
  return apiClient<Paginated<KakaoPlaceDto>>(`/api/v1/kakao-places/search?${params}`)
}
