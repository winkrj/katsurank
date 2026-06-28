import type { MapFilterKey } from '../types/map'

export const MAP_FILTERS: { key: MapFilterKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'top', label: '1위권' },
  { key: 'korean', label: '한식 돈까스' },
  { key: 'japanese', label: '일식 돈까스' },
  { key: 'curry', label: '카레 돈까스' },
]

export const SEOUL_CENTER = { lat: 37.5326, lng: 126.9906 }
export const MAP_DEFAULT_LEVEL = 8
