import { apiClient } from './client'

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

export type KakaoPlaceSearchResultDto = {
  places: KakaoPlaceDto[]
  page: number
  totalPages: number
  totalCount: number
  isEnd: boolean
}

export function searchKakaoPlacesProxy(query: string, page = 1) {
  const params = new URLSearchParams({ query, page: String(page) })
  return apiClient<KakaoPlaceSearchResultDto>(`/api/v1/kakao-places/search?${params}`)
}
