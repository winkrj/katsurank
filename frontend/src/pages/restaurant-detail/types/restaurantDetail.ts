export type VoteTrendPoint = {
  label: string
  value: number
}

export type MenuItem = {
  name: string
  price: number
}

export type RestaurantDetail = {
  id: number
  name: string
  rank: number
  rankAreaLabel: string
  rankBadgeLabel: string
  tagline: string
  totalVotes: number
  weeklyVoteDelta: number
  voteTrend: VoteTrendPoint[]
  images: string[]
  address: string
  shortAddress: string
  distance: string
  hours: string
  breakTime: string
  phone: string
  kakaoMapUrl: string
  menuItems: MenuItem[]
  closedDays: string
  parking: string
  reservation: string
  reviewCount: number
}
