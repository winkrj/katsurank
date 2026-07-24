import { apiClient, setCsrfToken } from './client'
import type { AuthMeResponse, CsrfTokenResponse } from '../types/auth'

export async function fetchCsrf() {
  const data = await apiClient<CsrfTokenResponse>('/api/v1/auth/csrf')
  setCsrfToken(data.token)
  return data
}

export function fetchAuthMe() {
  return apiClient<AuthMeResponse>('/api/v1/auth/me')
}

export function logoutRequest() {
  return apiClient<void>('/api/v1/auth/logout', { method: 'POST' })
}
