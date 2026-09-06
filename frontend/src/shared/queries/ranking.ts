import { useQuery } from '@tanstack/react-query'
import { fetchRanking, fetchRankingTop, fetchMapPins, fetchRestaurantRankingHistory } from '../api/ranking'
import { queryKeys } from './queryKeys'

export function useRankingQuery(limit = 20, offset = 0) {
  return useQuery({
    queryKey: queryKeys.ranking.list(limit, offset),
    queryFn: () => fetchRanking(limit, offset),
  })
}

export function useRankingTopQuery() {
  return useQuery({
    queryKey: queryKeys.ranking.top,
    queryFn: fetchRankingTop,
  })
}

export function useMapPinsQuery() {
  return useQuery({
    queryKey: queryKeys.ranking.mapPins,
    queryFn: fetchMapPins,
  })
}

export function useRestaurantRankingHistoryQuery(restaurantId: number) {
  return useQuery({
    queryKey: queryKeys.ranking.history(restaurantId),
    queryFn: () => fetchRestaurantRankingHistory(restaurantId),
    enabled: restaurantId > 0,
  })
}
