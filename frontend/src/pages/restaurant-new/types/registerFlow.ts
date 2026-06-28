export type RegisterStep = 'search' | 'location' | 'confirm' | 'complete'

export type KakaoPlace = {
  kakaoPlaceId: string
  name: string
  address: string
  roadAddress: string
  phone: string
  category: string
  latitude: number
  longitude: number
  isRegistered: boolean
  registeredRestaurantId?: number
}

export type RegisterDraft = {
  place: KakaoPlace
  photoPreview: string | null
}

export type RegisterCompleteResult = {
  restaurantId: number
  restaurantName: string
}
