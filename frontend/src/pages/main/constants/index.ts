import type { RegisterStep } from '../types/registerFlow'

export const SEOUL_CENTER = { lat: 37.5326, lng: 126.9906 }
export const MAP_DEFAULT_LEVEL = 8
// 서울 전체가 보이는 정도에서 더 이상 축소되지 않도록 제한
export const MAP_MAX_LEVEL = 10

export const REGISTER_STEPS: { key: RegisterStep; label: string }[] = [
  { key: 'search', label: '가게 입력' },
  { key: 'location', label: '장소 선택' },
  { key: 'confirm', label: '최종 확인' },
]
