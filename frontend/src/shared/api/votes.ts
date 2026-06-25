import { apiClient } from './client'
import type { VoteRequest } from '../types/vote'

export function createVote(body: VoteRequest) {
  return apiClient<void>('/api/votes', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
