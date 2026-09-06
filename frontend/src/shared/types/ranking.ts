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

// GET /api/v1/restaurants/{id}/ranking-history — KST 기준 날짜 오름차순, 최근 7건까지(초기엔 더 적을 수 있음)
export type RankingHistoryItem = {
  date: string
  rank: number
  voteCount: number
}
