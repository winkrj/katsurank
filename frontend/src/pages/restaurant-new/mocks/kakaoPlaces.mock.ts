import type { KakaoPlace } from '../types/registerFlow'

export const MOCK_KAKAO_PLACES: KakaoPlace[] = [
  {
    kakaoPlaceId: 'kakao-place-1',
    name: '정돈 강남점',
    address: '서울 강남구 테헤란로 152',
    roadAddress: '서울 강남구 테헤란로 152',
    phone: '02-123-4567',
    category: '음식점 > 일식 > 돈까스,우동',
    latitude: 37.5012,
    longitude: 127.0396,
    isRegistered: true,
    registeredRestaurantId: 1,
  },
  {
    kakaoPlaceId: 'kakao-place-new-1',
    name: '성수동 수제돈까스',
    address: '서울 성동구 연무장15길 11',
    roadAddress: '서울 성동구 연무장15길 11',
    phone: '02-555-1234',
    category: '음식점 > 일식 > 돈까스',
    latitude: 37.5445,
    longitude: 127.0559,
    isRegistered: false,
  },
  {
    kakaoPlaceId: 'kakao-place-new-2',
    name: '홍대 경양식 돈까스',
    address: '서울 마포구 와우산로 29길 20',
    roadAddress: '서울 마포구 와우산로 29길 20',
    phone: '02-333-9876',
    category: '음식점 > 양식 > 경양식',
    latitude: 37.5563,
    longitude: 126.9236,
    isRegistered: false,
  },
  {
    kakaoPlaceId: 'kakao-place-new-3',
    name: '종로 할머니 돈까스',
    address: '서울 종로구 종로 123',
    roadAddress: '서울 종로구 종로 123',
    phone: '02-777-4321',
    category: '음식점 > 일식 > 돈까스',
    latitude: 37.5704,
    longitude: 126.9827,
    isRegistered: false,
  },
]

export function searchMockKakaoPlaces(query: string): KakaoPlace[] {
  const keyword = query.trim().toLowerCase()
  if (!keyword) return []

  return MOCK_KAKAO_PLACES.filter(
    (place) =>
      place.name.toLowerCase().includes(keyword) ||
      place.address.toLowerCase().includes(keyword) ||
      place.roadAddress.toLowerCase().includes(keyword),
  )
}
