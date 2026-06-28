import { useState } from 'react'
import { MOCK_MAP_RESTAURANTS } from '../../mocks/map.mock'
import type { MapFilterKey, MapRestaurant } from '../../types/map'
import { MapFilterTabs } from '../MapFilterTabs'
import { MapKakaoMap } from '../MapKakaoMap'
import { MapSearchBar } from '../MapSearchBar'
import { MapSelectedMiniCard } from '../MapSelectedMiniCard'

const HEADER_HEIGHT = 56
const BOTTOM_NAV_HEIGHT = 68

export function MobileMapPage() {
  const [activeFilter, setActiveFilter] = useState<MapFilterKey>('all')
  const [selected, setSelected] = useState<MapRestaurant | null>(null)

  const restaurants = MOCK_MAP_RESTAURANTS

  return (
    <div
      className="flex flex-col overflow-hidden bg-[#FFFDF4]"
      style={{
        marginTop: `${HEADER_HEIGHT}px`,
        height: `calc(100vh - ${HEADER_HEIGHT}px - ${BOTTOM_NAV_HEIGHT}px - env(safe-area-inset-bottom, 0px))`,
      }}
    >
      {/* 검색 + 필터 — 문서 흐름으로 자연스럽게 높이 차지 */}
      <div className="z-10 shrink-0 bg-white px-3 pb-2 pt-2 shadow-sm">
        <MapSearchBar className="mb-2" />
        <MapFilterTabs active={activeFilter} onChange={setActiveFilter} />
      </div>

      {/* 지도 — 나머지 공간 전부 */}
      <div className="relative flex-1">
        <MapKakaoMap
          restaurants={restaurants}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
          className="absolute inset-0"
        />

        {/* 줌 컨트롤 */}
        <div className="absolute bottom-20 right-3 z-10 flex flex-col overflow-hidden rounded-lg border border-[#E8D9BF] bg-white shadow-md">
          <button
            type="button"
            aria-label="확대"
            className="flex size-9 items-center justify-center border-b border-[#E8D9BF] text-[20px] font-light text-[#2A1A12]"
          >
            +
          </button>
          <button
            type="button"
            aria-label="축소"
            className="flex size-9 items-center justify-center border-b border-[#E8D9BF] text-[20px] font-light text-[#2A1A12]"
          >
            −
          </button>
          <button
            type="button"
            aria-label="현재 위치"
            className="flex size-9 items-center justify-center text-[#2A1A12]"
          >
            <LocationIcon />
          </button>
        </div>

        {/* 선택된 가게 미니 카드 */}
        {selected && <MapSelectedMiniCard restaurant={selected} onClose={() => setSelected(null)} />}
      </div>
    </div>
  )
}

function LocationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <circle cx="9" cy="9" r="3" />
      <path d="M9 1v2M9 15v2M1 9h2M15 9h2" />
    </svg>
  )
}
