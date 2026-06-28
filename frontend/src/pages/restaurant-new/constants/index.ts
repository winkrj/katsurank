import type { RegisterStep } from '../types/registerFlow'

export const REGISTER_STEPS: { key: RegisterStep; label: string }[] = [
  { key: 'search', label: '가게 입력' },
  { key: 'location', label: '장소 선택' },
  { key: 'confirm', label: '최종 확인' },
]

/** 목업 등록 API 성공 시 반환 ID */
export const MOCK_REGISTERED_RESTAURANT_ID = 99
