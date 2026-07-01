import type { RestaurantDetail } from '../types/restaurantDetail'

const MOCK_RESTAURANT: RestaurantDetail = {
  id: 1,
  name: '정돈 강남점',
  rank: 1,
  rankAreaLabel: '강남 1위',
  rankBadgeLabel: '전체 1위',
  tagline: '1,248명이 선택한 인생 돈까스',
  totalVotes: 1248,
  weeklyVoteDelta: 124,
  voteTrend: [
    { label: '5/4', value: 980 },
    { label: '5/5', value: 1010 },
    { label: '5/6', value: 1055 },
    { label: '5/7', value: 1090 },
    { label: '5/8', value: 1150 },
    { label: '5/9', value: 1195 },
    { label: '5/10', value: 1248 },
  ],
  images: [
    '/images/shop_default_img.png',
    '/images/shop_default_img.png',
    '/images/shop_default_img.png',
    '/images/shop_default_img.png',
  ],
  address: '서울 강남구 테헤란로 152',
  shortAddress: '강남구 테헤란로 152',
  distance: '강남역 11번 출구에서 320m',
  hours: '영업중 11:00 - 21:30',
  breakTime: '브레이크타임 15:00 - 17:00',
  phone: '02-123-4567',
  kakaoMapUrl: 'https://map.kakao.com',
  closedDays: '매주 월요일',
  parking: '가능',
  reservation: '불가능',
  reviewCount: 126,
}

export function getMockRestaurantDetail(id?: string): RestaurantDetail | null {
  if (!id) return MOCK_RESTAURANT
  if (id === '1') return MOCK_RESTAURANT
  return { ...MOCK_RESTAURANT, id: Number(id), name: `가게 #${id}` }
}
