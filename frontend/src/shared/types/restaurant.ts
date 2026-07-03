export type RestaurantStatus = 'ACTIVE' | 'CLOSED' | 'RELOCATED' | 'PENDING' | 'REJECTED'

export type RestaurantResponse = {
  id: number
  name: string
  address: string
  latitude: number
  longitude: number
  kakaoPlaceId: string
  voteCount: number
  rank: number | null
  status: RestaurantStatus
  createdAt: string
}

export type RestaurantRegisterRequest = {
  kakaoPlaceId: string
  name: string
  address: string
  latitude: number
  longitude: number
}

export type RelocateRequest = {
  newRestaurantId: number
}
