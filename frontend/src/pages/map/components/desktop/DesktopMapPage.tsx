import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../../../shared/stores/authStore'
import { RankingList } from '../../../home/components/RankingList'
import { MOCK_MAP_RESTAURANTS } from '../../mocks/map.mock'
import type { MapFilterKey, MapRestaurant } from '../../types/map'
import { MapFilterTabs } from '../MapFilterTabs'
import { MapKakaoMap } from '../MapKakaoMap'
import { MapSearchBar } from '../MapSearchBar'
import { MapSelectedCard } from '../MapSelectedCard'

export function DesktopMapPage() {
  const [activeFilter, setActiveFilter] = useState<MapFilterKey>('all')
  const [searchInMap, setSearchInMap] = useState(false)
  const [showList, setShowList] = useState(false)
  const [selected, setSelected] = useState<MapRestaurant | null>(null)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn())

  const restaurants = MOCK_MAP_RESTAURANTS

  return (
    <div className="flex h-screen pt-20">
      {/* 좌측 사이드바 */}
      <aside className="flex w-[320px] shrink-0 flex-col border-r border-[#E8D9BF] bg-[#FFFDF4]">
        {/* 검색바 — 고정 */}
        <div className="shrink-0 p-4 pb-3">
          <MapSearchBar />
        </div>

        {/* 랭킹 목록 — 스크롤 */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <RankingList layout="default" limit={100} />
        </div>

        {/* 내 한 표 — 하단 고정 */}
        <div className="shrink-0 border-t border-[#E8D9BF] p-4">
          <div className="rounded-xl border border-[#E8D9BF] bg-white p-4">
            <p className="text-[13px] font-black text-[#2A1A12]">내 한 표</p>
            <p className="mt-0.5 text-[12px] text-[#8A7A6A]">아직 투표하지 않았어요.</p>
            {isLoggedIn ? (
              <button
                type="button"
                className="mt-3 w-full rounded-xl border border-[#DBBA24] bg-[#FFC533] py-2.5 text-[14px] font-black text-[#2A1A12] transition hover:bg-[#D88A24]"
              >
                내 한 표 던지기
              </button>
            ) : (
              <Link
                to="/"
                className="mt-3 block w-full rounded-xl border border-[#DBBA24] bg-[#FFC533] py-2.5 text-center text-[14px] font-black text-[#2A1A12] transition hover:bg-[#D88A24]"
              >
                로그인 후 투표하기
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* 지도 영역 */}
      <div className="relative flex-1 overflow-hidden">
        {/* 필터 바 */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-3 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm">
          <MapFilterTabs active={activeFilter} onChange={setActiveFilter} className="flex-1" />

          <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[13px] font-semibold text-[#2A1A12]">
            <input
              type="checkbox"
              checked={searchInMap}
              onChange={(e) => setSearchInMap(e.target.checked)}
              className="size-4 accent-[#FFC533]"
            />
            현재 지도에서 검색
          </label>

          <button
            type="button"
            onClick={() => setShowList((v) => !v)}
            className="shrink-0 rounded-xl border border-[#2A1A12] bg-[#2A1A12] px-4 py-2 text-[13px] font-bold text-white transition hover:bg-[#3A2318]"
          >
            {showList ? '지도 보기' : '목록 보기'}
          </button>
        </div>

        {/* 카카오맵 */}
        <MapKakaoMap
          restaurants={restaurants}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
          className="h-full"
        />

        {/* 줌 컨트롤 */}
        <div className="absolute bottom-[160px] right-4 z-10 flex flex-col overflow-hidden rounded-lg border border-[#E8D9BF] bg-white shadow-md">
          <button
            type="button"
            aria-label="확대"
            className="flex size-9 items-center justify-center border-b border-[#E8D9BF] text-[20px] font-light text-[#2A1A12] transition hover:bg-[#FFF4D8]"
          >
            +
          </button>
          <button
            type="button"
            aria-label="축소"
            className="flex size-9 items-center justify-center border-b border-[#E8D9BF] text-[20px] font-light text-[#2A1A12] transition hover:bg-[#FFF4D8]"
          >
            −
          </button>
          <button
            type="button"
            aria-label="현재 위치"
            className="flex size-9 items-center justify-center text-[#2A1A12] transition hover:bg-[#FFF4D8]"
          >
            <LocationIcon />
          </button>
        </div>

        {/* 선택된 가게 카드 */}
        {selected && <MapSelectedCard restaurant={selected} onClose={() => setSelected(null)} />}
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
