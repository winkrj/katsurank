import { useEffect, useMemo, useState } from 'react'
import { useMapPinsQuery } from '../../../../shared/queries/ranking'
import { useMeQuery } from '../../../../shared/queries/me'
import { useAuthStore } from '../../../../shared/stores/authStore'
import type { MapRestaurant } from '../../types/map'
import { mapPinsToRestaurants } from '../../utils/mapPinsToRestaurants'
import { MapKakaoMap } from '../MapKakaoMap'
import { MapSearchBar } from '../MapSearchBar'
import { MapSelectedMiniCard } from './MapSelectedMiniCard'

const HEADER_HEIGHT = 56
const BOTTOM_NAV_HEIGHT = 68

export function MobileMapPage() {
  const [selected, setSelected] = useState<MapRestaurant | null>(null)
  const [autoFocusReason, setAutoFocusReason] = useState<'myVote' | 'top1' | null>(null)
  const [hasAutoSelected, setHasAutoSelected] = useState(false)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn())
  const meQuery = useMeQuery(isLoggedIn)

  const { data: pins = [] } = useMapPinsQuery()

  const restaurants: MapRestaurant[] = useMemo(() => mapPinsToRestaurants(pins), [pins])

  // 진입 시 내가 투표한 가게(없으면 1위)를 자동으로 포커스한다.
  useEffect(() => {
    if (hasAutoSelected || restaurants.length === 0) return
    if (isLoggedIn && meQuery.isLoading) return

    const currentVote = meQuery.data?.currentVote
    const target = currentVote
      ? restaurants.find((r) => r.id === currentVote.restaurantId)
      : restaurants[0]

    if (target) {
      // 쿼리 데이터가 도착한 뒤 딱 한 번만 자동 포커스한다 (hasAutoSelected로 재실행 방지).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(target)
      setAutoFocusReason(currentVote ? 'myVote' : 'top1')
      setHasAutoSelected(true)
    }
  }, [restaurants, isLoggedIn, meQuery.data, meQuery.isLoading, hasAutoSelected])

  function handleSelect(restaurant: MapRestaurant) {
    setSelected(restaurant)
    setAutoFocusReason(null)
  }

  return (
    <div
      className="flex flex-col overflow-hidden bg-[#FFFDF4]"
      style={{
        marginTop: `${HEADER_HEIGHT}px`,
        height: `calc(100vh - ${HEADER_HEIGHT}px - ${BOTTOM_NAV_HEIGHT}px - env(safe-area-inset-bottom, 0px))`,
      }}
    >
      {/* 검색 */}
      {/* TODO: 2차 -> 카테고리 필터 API 나오면 MapFilterTabs 복원 */}
      <div className="z-10 shrink-0 bg-white px-3 pb-2 pt-2 shadow-sm">
        <MapSearchBar className="mb-2" />
      </div>

      {/* 지도 */}
      <div className="relative flex-1">
        <MapKakaoMap
          restaurants={restaurants}
          selectedId={selected?.id ?? null}
          onSelect={handleSelect}
          className="absolute inset-0"
        />

        {selected && (
          <MapSelectedMiniCard
            restaurant={selected}
            focusReason={autoFocusReason}
            onClose={() => {
              setSelected(null)
              setAutoFocusReason(null)
            }}
          />
        )}
      </div>
    </div>
  )
}
