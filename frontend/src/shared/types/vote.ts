export type VoteRequest = {
  restaurantId: number
}

export type VoteResponse = {
  id: number
  userId: number
  restaurantId: number
  createdAt: string
}
