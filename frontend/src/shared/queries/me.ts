import { useQuery } from '@tanstack/react-query'
import { fetchMe, fetchVoteHistory } from '../api/me'
import { queryKeys } from './queryKeys'

export function useMeQuery() {
  return useQuery({
    queryKey: queryKeys.me.profile,
    queryFn: fetchMe,
    retry: false,
  })
}

export function useVoteHistoryQuery() {
  return useQuery({
    queryKey: queryKeys.me.voteHistory,
    queryFn: fetchVoteHistory,
  })
}
