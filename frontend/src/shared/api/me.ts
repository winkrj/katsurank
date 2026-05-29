import { apiClient } from './client'

export type Me = {
  id: number
  nickname: string
  profileImage?: string
  currentRestaurant?: {
    id: number
    name: string
  }
}

export type VoteHistoryItem = {
  restaurantId: number
  restaurantName: string
  votedAt: string
}

export function fetchMe() {
  return apiClient<Me>('/api/me')
}

export function fetchVoteHistory() {
  return apiClient<VoteHistoryItem[]>('/api/me/vote-history')
}
