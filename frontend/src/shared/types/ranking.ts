export type RankingItem = {
  rank: number
  restaurantId: number
  restaurantName: string
  voteCount: number
}

export type MapPinResponse = {
  restaurantId: number
  name: string
  latitude: number
  longitude: number
  voteCount: number
  rank: number
}
