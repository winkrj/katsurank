export type CurrentVoteResponse = {
  restaurantId: number
  restaurantName: string
  votedAt: string
}

export type MeResponse = {
  id: number
  kakaoId: string
  nickname: string
  profileImageUrl: string | null
  currentVote: CurrentVoteResponse | null
}

export type VoteHistoryItem = {
  restaurantId: number
  restaurantName: string
  movedAt: string
}
