import type { PeriodKey, RegionFilterKey } from '../types/rankingDetail'

export const REGION_FILTERS: { key: RegionFilterKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'seoul', label: '서울' },
  { key: 'gyeonggi', label: '경기' },
  { key: 'incheon', label: '인천' },
  { key: 'busan', label: '부산' },
  { key: 'daegu', label: '대구' },
  { key: 'gwangju', label: '광주' },
  { key: 'daejeon', label: '대전' },
  { key: 'etc', label: '기타' },
]

export const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: 'weekly', label: '주간' },
  { key: 'monthly', label: '월간' },
  { key: 'alltime', label: '전체' },
]

export const RANKING_PREVIEW_COUNT = 5
