import { useQuery } from '@tanstack/react-query'
import { fetchRestaurant, searchRestaurants } from '../api/restaurants'
import { queryKeys } from './queryKeys'

export function useRestaurantQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.restaurants.detail(id),
    queryFn: () => fetchRestaurant(id),
    enabled: id > 0,
  })
}

// q가 비어있으면 백엔드가 이름 필터 없이 전체 ACTIVE 목록을 반환함 — 검색페이지 첫 화면도 이걸로 채움
export function useRestaurantSearchQuery(q: string, limit = 10, offset = 0) {
  return useQuery({
    queryKey: queryKeys.restaurants.search(q, limit, offset),
    queryFn: () => searchRestaurants(q, limit, offset),
  })
}
