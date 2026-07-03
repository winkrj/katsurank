import { apiClient } from './client'

export type KakaoPlaceDto = {
  kakaoPlaceId: string
  name: string
  addressName: string
  roadAddressName: string
  phone: string
  categoryName: string
  latitude: number
  longitude: number
  isRegistered: boolean
  registeredRestaurantId?: number
}

export function searchKakaoPlacesProxy(q: string) {
  const params = new URLSearchParams({ q })
  return apiClient<KakaoPlaceDto[]>(`/api/v1/kakao-places/search?${params}`)
}
