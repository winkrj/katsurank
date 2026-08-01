import { useEffect, useMemo, useState } from 'react'
import { useMapPinsQuery } from '../../../../shared/queries/ranking'
import { useMeQuery } from '../../../../shared/queries/me'
import { useAuthStore } from '../../../../shared/stores/authStore'
import { useDetailIdParam } from '../../hooks/useDetailIdParam'
import type { MapRestaurant } from '../../types/map'
import { mapPinsToRestaurants } from '../../utils/mapPinsToRestaurants'
import { RestaurantDetailModal } from '../detail/RestaurantDetailModal'
import { RegisterRestaurantModal } from '../register/RegisterRestaurantModal'
import { MapKakaoMap } from '../MapKakaoMap'
import { MapSearchBar } from '../MapSearchBar'
import { RankingBottomSheet } from './RankingBottomSheet'
import { SelectedRestaurantMiniCard } from './SelectedRestaurantMiniCard'

const HEADER_HEIGHT = 56

export function MobileMainPage() {
  const [selected, setSelected] = useState<MapRestaurant | null>(null)
  const [autoFocusReason, setAutoFocusReason] = useState<'myVote' | 'top1' | null>(null)
  const [hasAutoSelected, setHasAutoSelected] = useState(false)
  const { detailId, openDetail, closeDetail } = useDetailIdParam()
  const [registerOpen, setRegisterOpen] = useState(false)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn())
  const meQuery = useMeQuery(isLoggedIn)

  const { data: pins = [] } = useMapPinsQuery()
  const restaurants: MapRestaurant[] = useMemo(() => mapPinsToRestaurants(pins), [pins])

  // 진입 시 자동으로 지도를 포커스한다.
  // 공유 링크(?restaurant=)로 들어왔으면 그 가게를, 아니면 내가 투표한 가게(없으면 1위)를 사용한다.
  useEffect(() => {
    if (hasAutoSelected || restaurants.length === 0) return
    if (detailId == null && isLoggedIn && meQuery.isLoading) return

    if (detailId != null) {
      const target = restaurants.find((r) => r.id === detailId)
      if (target) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelected(target)
        setHasAutoSelected(true)
      }
      return
    }

    const currentVote = meQuery.data?.currentVote
    const target = currentVote
      ? restaurants.find((r) => r.id === currentVote.restaurantId)
      : restaurants[0]

    if (target) {
      // 쿼리 데이터가 도착한 뒤 딱 한 번만 자동 포커스한다 (hasAutoSelected로 재실행 방지).
      setSelected(target)
      setAutoFocusReason(currentVote ? 'myVote' : 'top1')
      setHasAutoSelected(true)
    }
  }, [restaurants, isLoggedIn, meQuery.data, meQuery.isLoading, hasAutoSelected, detailId])

  function handleSelect(restaurant: MapRestaurant) {
    setSelected(restaurant)
    setAutoFocusReason(null)
  }

  return (
    <div
      className="fixed inset-x-0 z-0 flex flex-col overflow-hidden bg-[#FFFDF4]"
      style={{
        top: `${HEADER_HEIGHT}px`,
        bottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* 검색 */}
      <div className="z-10 flex shrink-0 items-center gap-2 bg-white px-3 py-2 shadow-sm">
        <MapSearchBar restaurants={restaurants} onSelect={handleSelect} className="flex-1" />
        <button
          type="button"
          onClick={() => setRegisterOpen(true)}
          aria-label="새 가게 등록하기"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#E8D9BF] bg-white text-[#2A1A12]"
        >
          <PlusIcon />
        </button>
      </div>

      {/* 지도 */}
      <div className="relative flex-1">
        <MapKakaoMap
          restaurants={restaurants}
          selectedId={selected?.id ?? null}
          onSelect={handleSelect}
          className="absolute inset-0"
        />

        {selected ? (
          <SelectedRestaurantMiniCard
            restaurant={selected}
            focusReason={autoFocusReason}
            onClose={() => {
              setSelected(null)
              setAutoFocusReason(null)
            }}
            onOpenDetail={openDetail}
          />
        ) : (
          <RankingBottomSheet onSelectRestaurant={openDetail} />
        )}
      </div>

      <RestaurantDetailModal restaurantId={detailId} isMobile onClose={closeDetail} />
      <RegisterRestaurantModal
        open={registerOpen}
        isMobile
        onClose={() => setRegisterOpen(false)}
        onViewRestaurant={openDetail}
      />
    </div>
  )
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M9 3v12M3 9h12" />
    </svg>
  )
}
