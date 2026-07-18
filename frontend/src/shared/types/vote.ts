export type VoteRequest = {
  restaurantId: number
}

export type VoteResponse = {
  voteId: number
  restaurantId: number
  restaurantName: string
  voteCount: number
  votedAt: string
}
