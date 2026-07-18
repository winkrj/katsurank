import { apiClient } from './client'
import type { MeResponse, VoteHistoryItem } from '../types/me'
import type { Paginated } from '../types/common'

export function fetchMe() {
  return apiClient<MeResponse>('/api/v1/me')
}

export function fetchVoteHistory() {
  return apiClient<Paginated<VoteHistoryItem>>('/api/v1/me/vote-history')
}
