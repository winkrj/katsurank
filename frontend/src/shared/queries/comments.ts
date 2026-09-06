import { useQuery } from '@tanstack/react-query'
import { fetchComments } from '../api/comments'
import { queryKeys } from './queryKeys'

export function useCommentsQuery(restaurantId: number, limit = 20, offset = 0) {
  return useQuery({
    queryKey: queryKeys.comments.list(restaurantId),
    queryFn: () => fetchComments(restaurantId, limit, offset),
    enabled: restaurantId > 0,
  })
}
