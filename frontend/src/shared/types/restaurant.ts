export type RestaurantStatus = 'ACTIVE' | 'CLOSED' | 'RELOCATED' | 'PENDING' | 'REJECTED'

export type RestaurantResponse = {
  id: number
  kakaoPlaceId: string
  name: string
  address: string
  roadAddress: string
  latitude: number
  longitude: number
  kakaoCategory: string
  phone: string
  placeUrl: string
  status: RestaurantStatus
  category: string
  voteCount: number
  rank: number | null
  createdAt: string
}

// GET /api/v1/restaurants/search — status=ACTIVE만 대상이라 status 필드 자체가 없음
export type RestaurantSearchResponse = {
  id: number
  name: string
  address: string
  voteCount: number
  rank: number
  placeUrl: string
}

export type RestaurantRegisterRequest = {
  kakaoPlaceId: string
  name: string
  address: string
  roadAddress: string
  latitude: number
  longitude: number
  kakaoCategory: string
  phone: string
  placeUrl: string
}

// PATCH /api/v1/restaurants/{id}/close 응답 — RestaurantResponse 전체가 아니라 요약만 내려옴
export type CloseResponse = {
  id: number
  name: string
  status: RestaurantStatus
  closedAt: string
}

// PATCH /api/v1/restaurants/{id}/relocate 요청 — 옮겨갈 새 가게를 id가 아니라 kakaoPlaceId로 지정
export type RelocateRequest = {
  newKakaoPlaceId: string
}

export type RelocateResponse = {
  oldRestaurantId: number
  newRestaurantId: number
  movedVoteCount: number
}
