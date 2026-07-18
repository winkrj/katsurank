import type { RestaurantStatus } from './restaurant'

export type CurrentVoteResponse = {
  restaurantId: number
  restaurantName: string
  restaurantStatus: RestaurantStatus
  votedAt: string
  rank: number | null
}

export type MeResponse = {
  id: number
  nickname: string
  profileImage: string | null
  currentVote: CurrentVoteResponse | null
}

export type VoteHistoryItem = {
  restaurantId: number
  restaurantName: string
  restaurantStatus: RestaurantStatus
  votedAt: string
  isCurrent: boolean
}
