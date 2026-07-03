import { apiClient } from './client'
import type { MeResponse } from '../types/me'

export function fetchCsrf() {
  return apiClient<void>('/api/v1/auth/csrf')
}

export function fetchAuthMe() {
  return apiClient<MeResponse>('/api/v1/auth/me')
}
