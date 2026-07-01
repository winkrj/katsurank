import { useState } from 'react';
import { MOCK_MAP_RESTAURANTS } from '../../mocks/map.mock';
import type { MapFilterKey, MapRestaurant } from '../../types/map';
import { MapFilterTabs } from '../MapFilterTabs';
import { MapKakaoMap } from '../MapKakaoMap';
import { MapSearchBar } from '../MapSearchBar';
import { MapSelectedMiniCard } from '../MapSelectedMiniCard';

const HEADER_HEIGHT = 56;
const BOTTOM_NAV_HEIGHT = 68;

export function MobileMapPage() {
  const [activeFilter, setActiveFilter] = useState<MapFilterKey>('all');
  const [selected, setSelected] = useState<MapRestaurant | null>(null);

  const restaurants = MOCK_MAP_RESTAURANTS;

  return (
    <div
      className="flex flex-col overflow-hidden bg-[#FFFDF4]"
      style={{
        marginTop: `${HEADER_HEIGHT}px`,
        height: `calc(100vh - ${HEADER_HEIGHT}px - ${BOTTOM_NAV_HEIGHT}px - env(safe-area-inset-bottom, 0px))`,
      }}
    >
      {/* 검색 + 필터 */}
      <div className="z-10 shrink-0 bg-white px-3 pb-2 pt-2 shadow-sm">
        <MapSearchBar className="mb-2" />
        <MapFilterTabs active={activeFilter} onChange={setActiveFilter} />
      </div>

      {/* 지도 — 나머지 공간 전부 (zoom 버튼은 MapKakaoMap 내부) */}
      <div className="relative flex-1">
        <MapKakaoMap
          restaurants={restaurants}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
          className="absolute inset-0"
        />

        {selected && (
          <MapSelectedMiniCard restaurant={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}
