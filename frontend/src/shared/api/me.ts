import { apiClient } from './client'
import type { MeResponse, VoteHistoryItem } from '../types/me'

export function fetchMe() {
  return apiClient<MeResponse>('/api/v1/me')
}

export function fetchVoteHistory() {
  return apiClient<VoteHistoryItem[]>('/api/v1/me/vote-history')
}
