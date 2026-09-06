import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMapPinsQuery } from '../../../../shared/queries/ranking'
import { useDetailIdParam } from '../../hooks/useDetailIdParam'
import { RegisterRestaurantModal } from '../register/RegisterRestaurantModal'
import { MapKakaoMap } from '../MapKakaoMap'
import { MapSearchBar } from '../MapSearchBar'
import { MyVoteCard } from '../MyVoteCard'
import { RankingPanel } from '../RankingPanel'
import type { MapRestaurant } from '../../types/map'
import { mapPinsToRestaurants } from '../../utils/mapPinsToRestaurants'
import { RestaurantDetailAside } from './RestaurantDetailAside'
import { SelectedRestaurantCard } from './SelectedRestaurantCard'

export function DesktopMainPage() {
  const [selected, setSelected] = useState<MapRestaurant | null>(null)
  const [registerOpen, setRegisterOpen] = useState(false)
  const { detailId, openDetail, closeDetail } = useDetailIdParam()
  const [hasFocusedFromUrl, setHasFocusedFromUrl] = useState(false)

  const { data: pins = [] } = useMapPinsQuery()
  const restaurants: MapRestaurant[] = useMemo(() => mapPinsToRestaurants(pins), [pins])

  // 공유 링크(?restaurant=)로 진입한 경우, 가게 목록이 로드되면 지도도 그 가게로 포커싱한다.
  useEffect(() => {
    if (hasFocusedFromUrl || detailId == null || restaurants.length === 0) return
    const target = restaurants.find((r) => r.id === detailId)
    if (target) {
      // 쿼리 데이터가 도착한 뒤 딱 한 번만 자동 포커스한다 (hasFocusedFromUrl로 재실행 방지).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(target)
      setHasFocusedFromUrl(true)
    }
  }, [hasFocusedFromUrl, detailId, restaurants])

  function handlePinSelect(restaurant: MapRestaurant) {
    setSelected(restaurant)
  }

  function handleRankingSelect(id: number) {
    const target = restaurants.find((r) => r.id === id)
    if (target) {
      setSelected(target)
    } else {
      openDetail(id)
    }
  }

  return (
    <div className="flex h-screen pt-20">
      <div className="flex min-h-0 flex-1">
        {/* 좌측 사이드바 — 랭킹 리스트 또는 선택한 가게 상세 */}
        <aside className="flex w-[340px] shrink-0 flex-col border-r border-[#E8D9BF] bg-white">
          {detailId != null ? (
            <div className="min-h-0 flex-1">
              <RestaurantDetailAside restaurantId={detailId} onClose={closeDetail} />
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4">
                <RankingPanel limit={100} onSelectRestaurant={handleRankingSelect} />
              </div>

              <div className="shrink-0 space-y-3 border-t border-[#E8D9BF] p-4">
                <MyVoteCard onOpenDetail={openDetail} />
                <div className="flex items-center justify-center gap-3 text-[11px] font-bold text-[#8A7A6A]">
                  <Link to="/privacy" className="hover:text-[#2A1A12]">
                    개인정보처리방침
                  </Link>
                  <span className="text-[#E8D9BF]">|</span>
                  <Link to="/terms" className="hover:text-[#2A1A12]">
                    이용약관
                  </Link>
                </div>
              </div>
            </>
          )}
        </aside>

        {/* 지도 영역 */}
        <div className="relative flex-1 overflow-hidden">
          <MapKakaoMap
            restaurants={restaurants}
            selectedId={selected?.id ?? null}
            onSelect={handlePinSelect}
            className="h-full"
          />

          {/* 지도 위 검색바 — 지도 영역 우측 상단 */}
          <div className="absolute right-4 top-4 z-10 flex items-center gap-3">
            <MapSearchBar restaurants={restaurants} onSelect={setSelected} className="w-[320px]" />
            <button
              type="button"
              onClick={() => setRegisterOpen(true)}
              className="shrink-0 whitespace-nowrap rounded-xl border border-[#E8D9BF] bg-white px-4 py-2.5 text-[13px] font-bold text-[#2A1A12] shadow-[0_8px_24px_rgba(42,26,18,0.18)] transition hover:border-[#D88A24] hover:bg-[#FFF4D8]"
            >
              + 새 가게 등록하기
            </button>
          </div>

          {selected && detailId == null && (
            <SelectedRestaurantCard
              restaurant={selected}
              onClose={() => setSelected(null)}
              onOpenDetail={openDetail}
            />
          )}
        </div>
      </div>

      <RegisterRestaurantModal
        open={registerOpen}
        isMobile={false}
        onClose={() => setRegisterOpen(false)}
        onViewRestaurant={openDetail}
      />
    </div>
  )
}
