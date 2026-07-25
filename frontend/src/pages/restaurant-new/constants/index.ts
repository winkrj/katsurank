import type { RegisterStep } from '../types/registerFlow'

export const REGISTER_STEPS: { key: RegisterStep; label: string }[] = [
  { key: 'search', label: '가게 입력' },
  { key: 'location', label: '장소 선택' },
  { key: 'confirm', label: '최종 확인' },
]
