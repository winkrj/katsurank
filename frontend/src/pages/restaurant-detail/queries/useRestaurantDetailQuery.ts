import { useQuery } from '@tanstack/react-query'
import { fetchRestaurant } from '../../../shared/api/restaurants'
import { queryKeys } from '../../../shared/queries/queryKeys'
import type { RestaurantResponse } from '../../../shared/types/restaurant'
import type { RestaurantDetail } from '../types/restaurantDetail'

function mapToDetail(r: RestaurantResponse): RestaurantDetail {
  const isClosed = r.status === 'CLOSED'

  return {
    id: r.id,
    status: r.status,
    name: r.name,
    rank: r.rank ?? 0,
    rankAreaLabel: r.rank ? `서울 ${r.rank}위` : '',
    rankBadgeLabel: r.rank ? `전체 ${r.rank}위` : '',
    tagline: isClosed
      ? '폐업으로 랭킹과 투표에서 제외된 가게입니다'
      : `${r.voteCount.toLocaleString()}명이 선택한 인생 돈까스`,
    totalVotes: r.voteCount,
    weeklyVoteDelta: 0,
    voteTrend: [
      { label: '5/4', value: Math.max(0, r.voteCount - 70) },
      { label: '5/5', value: Math.max(0, r.voteCount - 52) },
      { label: '5/6', value: Math.max(0, r.voteCount - 38) },
      { label: '5/7', value: Math.max(0, r.voteCount - 29) },
      { label: '5/8', value: Math.max(0, r.voteCount - 18) },
      { label: '5/9', value: Math.max(0, r.voteCount - 7) },
      { label: '5/10', value: r.voteCount },
    ],
    images: [
      '/images/shop_default_img.png',
      '/images/shop_default_img.png',
      '/images/shop_default_img.png',
      '/images/shop_default_img.png',
    ],
    address: r.address,
    shortAddress: r.address,
    distance: '',
    hours: isClosed ? '폐업' : '영업 정보 준비 중',
    breakTime: isClosed ? '더 이상 영업하지 않는 가게예요' : '',
    phone: '02-123-4567',
    kakaoMapUrl: r.kakaoPlaceId ? `https://place.map.kakao.com/${r.kakaoPlaceId}` : '',
    closedDays: isClosed ? '폐업' : '',
    parking: '',
    reservation: '',
    reviewCount: 0,
  }
}

export function useRestaurantDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.restaurants.detail(Number(id ?? 0)),
    queryFn: () => fetchRestaurant(Number(id)).then(mapToDetail),
    enabled: Boolean(id),
  })
}
