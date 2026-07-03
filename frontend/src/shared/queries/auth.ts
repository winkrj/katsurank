import { useQuery } from '@tanstack/react-query'
import { fetchAuthMe } from '../api/auth'
import { queryKeys } from './queryKeys'

export function useAuthMeQuery() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: fetchAuthMe,
    retry: false,
    staleTime: 1000 * 60 * 5,
  })
}
