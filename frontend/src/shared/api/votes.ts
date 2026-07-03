import { apiClient } from './client'
import type { VoteRequest, VoteResponse } from '../types/vote'

export function createVote(body: VoteRequest) {
  return apiClient<VoteResponse>('/api/v1/votes', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
