import { apiClient } from './client'
import type { AuthMeResponse, CsrfTokenResponse } from '../types/auth'

export function fetchCsrf() {
  return apiClient<CsrfTokenResponse>('/api/v1/auth/csrf')
}

export function fetchAuthMe() {
  return apiClient<AuthMeResponse>('/api/v1/auth/me')
}

export function logoutRequest() {
  return apiClient<void>('/api/v1/auth/logout', { method: 'POST' })
}
