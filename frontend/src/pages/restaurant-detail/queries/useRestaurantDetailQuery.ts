import { useQuery } from '@tanstack/react-query'
import { fetchRestaurant } from '../../../shared/api/restaurants'
import { queryKeys } from '../../../shared/queries/queryKeys'
import type { RestaurantResponse } from '../../../shared/types/restaurant'
import type { RestaurantDetail } from '../types/restaurantDetail'

function mapToDetail(r: RestaurantResponse): RestaurantDetail {
  return {
    id: r.id,
    name: r.name,
    rank: r.rank ?? 0,
    rankAreaLabel: r.rank ? `서울 ${r.rank}위` : '',
    rankBadgeLabel: r.rank ? `전체 ${r.rank}위` : '',
    tagline: `${r.voteCount.toLocaleString()}명이 선택한 인생 돈까스`,
    totalVotes: r.voteCount,
    weeklyVoteDelta: 0,
    voteTrend: [],
    images: [],
    address: r.address,
    shortAddress: r.address,
    distance: '',
    hours: '',
    breakTime: '',
    phone: '',
    kakaoMapUrl: r.kakaoPlaceId ? `https://place.map.kakao.com/${r.kakaoPlaceId}` : '',
    closedDays: '',
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
