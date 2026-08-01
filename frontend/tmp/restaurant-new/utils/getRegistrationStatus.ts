import type { KakaoPlace } from '../types/registerFlow'

const TONKATSU_KEYWORDS = ['돈까스', '돈가스', '돈카츠', '카츠', '커틀렛']

export type RegistrationStatus = {
  canRegister: boolean
  reason: string | null
}

export function getRegistrationStatus(place: KakaoPlace): RegistrationStatus {
  const address = place.roadAddress || place.address
  const isSeoul = address.startsWith('서울')
  const text = `${place.name} ${place.category}`
  const isTonkatsu = TONKATSU_KEYWORDS.some((keyword) => text.includes(keyword))

  if (!isSeoul) {
    return { canRegister: false, reason: '서울에 있는 가게만 등록할 수 있어요.' }
  }
  if (!isTonkatsu) {
    return { canRegister: false, reason: '돈까스집으로 확인되지 않아요.' }
  }
  return { canRegister: true, reason: null }
}
