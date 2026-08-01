export type RankingDetailItem = {
  id: number
  rank: number
  name: string
  address: string
  votes: number
  weeklyDelta?: number
  isOpen?: boolean
  hours?: string
  breakTime?: string
  image?: string
}

export type RegionFilterKey =
  | 'all'
  | 'gangnam'
  | 'seocho'
  | 'mapo'
  | 'yongsan'
  | 'songpa'
  | 'jongno'
  | 'seongsu'

export type PeriodKey = 'weekly' | 'monthly' | 'alltime'
