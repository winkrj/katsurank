import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/queries/queryKeys'
import { getMockRestaurantDetail } from '../mocks/restaurantDetail.mock'

/**
 * 가게 상세 조회 — API 연동 전 목업 반환.
 * 백엔드 준비 후 queryFn을 shared/api/restaurants.fetchRestaurant로 교체.
 */
export function useRestaurantDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.restaurants.detail(id ?? ''),
    queryFn: () => {
      const restaurant = getMockRestaurantDetail(id)
      if (!restaurant) {
        throw new Error('가게를 찾을 수 없습니다.')
      }
      return restaurant
    },
    enabled: Boolean(id),
  })
}
