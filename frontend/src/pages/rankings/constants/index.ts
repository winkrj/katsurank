import type { PeriodKey, RegionFilterKey } from '../types/rankingDetail'

export const REGION_FILTERS: { key: RegionFilterKey; label: string }[] = [
  { key: 'all', label: '서울 전체' },
  { key: 'gangnam', label: '강남' },
  { key: 'seocho', label: '서초' },
  { key: 'mapo', label: '마포·홍대' },
  { key: 'yongsan', label: '용산' },
  { key: 'songpa', label: '송파' },
  { key: 'jongno', label: '종로' },
  { key: 'seongsu', label: '성수' },
]

export const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: 'weekly', label: '주간' },
  { key: 'monthly', label: '월간' },
  { key: 'alltime', label: '전체' },
]

export const RANKING_PREVIEW_COUNT = 5
