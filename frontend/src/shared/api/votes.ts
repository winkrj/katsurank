import { apiClient } from './client'

export type VoteRequest = {
  restaurantId: number
}

export function createVote(body: VoteRequest) {
  return apiClient<void>('/api/votes', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
