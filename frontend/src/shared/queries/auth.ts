import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchAuthMe, fetchCsrf, logoutRequest } from '../api/auth'
import { useAuthStore } from '../stores/authStore'
import { queryKeys } from './queryKeys'

// SESSION 쿠키는 HttpOnly라 JS에서 읽을 수 없다. 로그인 여부는 항상 /auth/me를 호출해 서버에 물어봐야 한다.
export function useAuthMeQuery() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: fetchAuthMe,
    retry: false,
    staleTime: 1000 * 60 * 5,
  })
}

// SPA 최초 로드 시 한 번 호출하면 XSRF-TOKEN 쿠키가 발급된다. 이후 변경 요청에 apiClient가 자동으로 실어 보낸다.
export function useCsrfBootstrapQuery() {
  return useQuery({
    queryKey: queryKeys.auth.csrf,
    queryFn: fetchCsrf,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()
  const clearUser = useAuthStore((s) => s.logout)

  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      clearUser()
      queryClient.removeQueries({ queryKey: queryKeys.auth.me })
    },
  })
}
