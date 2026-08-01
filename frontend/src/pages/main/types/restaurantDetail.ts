import type { RestaurantStatus } from '../../../shared/types/restaurant'

export type RestaurantDetail = {
  id: number
  status: RestaurantStatus
  name: string
  rank: number
  rankAreaLabel: string
  rankBadgeLabel: string
  tagline: string
  totalVotes: number
  images: string[]
  address: string
  shortAddress: string
  distance: string
  hours: string
  breakTime: string
  phone: string
  kakaoMapUrl: string
  closedDays: string
  parking: string
  reservation: string
  reviewCount: number
}
