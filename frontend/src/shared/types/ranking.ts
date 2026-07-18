export type RankingItem = {
  rank: number
  id: number
  name: string
  address: string
  latitude: number
  longitude: number
  voteCount: number
  placeUrl: string
}

// GET /api/v1/ranking/map-pins — rank는 안 내려옴 (ACTIVE 전체 좌표 목록일 뿐, 랭킹 정보가 아님)
export type MapPinResponse = {
  id: number
  name: string
  latitude: number
  longitude: number
  voteCount: number
}
