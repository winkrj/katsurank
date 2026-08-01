import { useEffect, useRef, useState } from 'react';
import { MAP_DEFAULT_LEVEL, MAP_MAX_LEVEL, SEOUL_CENTER } from '../constants';
import type { MapRestaurant } from '../types/map';

type MapKakaoMapProps = {
  restaurants: MapRestaurant[];
  selectedId: number | null;
  onSelect: (restaurant: MapRestaurant) => void;
  className?: string;
};

function loadKakaoSdk(appkey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.kakao?.maps) {
      resolve();
      return;
    }
    const existingScript = document.querySelector('script[src^="//dapi.kakao.com/v2/maps/sdk.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => window.kakao.maps.load(resolve));
      existingScript.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&autoload=false`;
    script.onload = () => window.kakao.maps.load(resolve);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function MapKakaoMap({
  restaurants,
  selectedId,
  onSelect,
  className = '',
}: MapKakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const overlaysRef = useRef<Map<number, kakao.maps.CustomOverlay>>(new Map());
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const appkey = import.meta.env.VITE_KAKAO_MAP_APP_KEY as string | undefined;
    if (!containerRef.current || !appkey) return;

    let cancelled = false;

    loadKakaoSdk(appkey)
      .then(() => {
        if (cancelled || !containerRef.current) return;

        const { maps } = window.kakao;
        const center = new maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng);
        const map = new maps.Map(containerRef.current, { center, level: MAP_DEFAULT_LEVEL });
        map.setMaxLevel(MAP_MAX_LEVEL);
        mapRef.current = map;

        restaurants.forEach((r) => {
          const position = new maps.LatLng(r.lat, r.lng);
          const content = document.createElement('div');
          content.className = [
            'map-pin-overlay',
            r.rank === 1 ? 'map-pin-overlay--rank1' : '',
            r.id === selectedId ? 'map-pin-overlay--selected' : '',
          ]
            .filter(Boolean)
            .join(' ');
          content.innerHTML = `
            <span class="map-pin-overlay__rank">${r.rank}</span>
            <span class="map-pin-overlay__icon">
              <img src="/images/katsu_icon.png" alt="" style="width:100%;height:100%" />
            </span>
          `;
          content.addEventListener('click', () => onSelect(r));
          const overlay = new maps.CustomOverlay({ position, content, yAnchor: 1 });
          overlay.setMap(map);
          overlaysRef.current.set(r.id, overlay);
        });
      })
      .catch(() => {
        console.error('[KakaoMap] SDK 로드 실패');
      });

    return () => {
      cancelled = true;
      mapRef.current = null;
      const overlays = overlaysRef.current;
      overlays.forEach((o) => o.setMap(null));
      overlays.clear();
    };
  }, [restaurants]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const overlays = overlaysRef.current;
    overlays.forEach((overlay, id) => {
      const el = overlay.getContent() as HTMLElement;
      const r = restaurants.find((item) => item.id === id);
      if (!r) return;
      el.className = [
        'map-pin-overlay',
        r.rank === 1 ? 'map-pin-overlay--rank1' : '',
        id === selectedId ? 'map-pin-overlay--selected' : '',
      ]
        .filter(Boolean)
        .join(' ');
    });
  }, [selectedId, restaurants]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || selectedId == null) return;
    const r = restaurants.find((item) => item.id === selectedId);
    if (!r) return;

    const { maps } = window.kakao;
    const targetLatLng = new maps.LatLng(r.lat, r.lng);
    const projection = map.getProjection();
    const targetPoint = projection.pointFromCoords(targetLatLng);
    // 화면 좌표는 아래로 갈수록 y가 커진다 — 지도 중심을 핀보다 더 아래(y+)로 잡아야
    // 핀이 화면 중앙보다 위쪽(하단 선택 카드에 안 가리는 위치)에 보인다.
    const shiftedCenterPoint = new maps.Point(targetPoint.x, targetPoint.y + 50);
    map.setCenter(projection.coordsFromPoint(shiftedCenterPoint));
  }, [selectedId, restaurants]);

  function handleZoomIn() {
    const map = mapRef.current;
    if (!map) return;
    map.setLevel(map.getLevel() - 1);
  }

  function handleZoomOut() {
    const map = mapRef.current;
    if (!map) return;
    map.setLevel(map.getLevel() + 1);
  }

  function handleCurrentLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const map = mapRef.current;
        if (map) {
          const latlng = new window.kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
          map.setCenter(latlng);
          map.setLevel(4);
        }
        setLocating(false);
      },
      () => setLocating(false),
    );
  }

  return (
    // className으로 absolute inset-0 등 외부 포지셔닝 받음
    <div className={className}>
      {/* relative 래퍼: 줌 버튼 기준점 */}
      <div className="relative size-full">
        <div id="map" ref={containerRef} className="size-full" />

        {/* 줌 컨트롤 */}
        <div className="absolute bottom-10 right-4 z-10 flex flex-col overflow-hidden rounded-lg border border-[#E8D9BF] bg-white shadow-md">
          <button
            type="button"
            aria-label="확대"
            onClick={handleZoomIn}
            className="flex size-9 items-center justify-center border-b border-[#E8D9BF] text-[20px] font-light text-[#2A1A12] transition hover:bg-[#FFF4D8]"
          >
            +
          </button>
          <button
            type="button"
            aria-label="축소"
            onClick={handleZoomOut}
            className="flex size-9 items-center justify-center border-b border-[#E8D9BF] text-[20px] font-light text-[#2A1A12] transition hover:bg-[#FFF4D8]"
          >
            −
          </button>
          <button
            type="button"
            aria-label="현재 위치"
            onClick={handleCurrentLocation}
            disabled={locating}
            className="flex size-9 items-center justify-center text-[#2A1A12] transition hover:bg-[#FFF4D8] disabled:opacity-40"
          >
            <LocationIcon spinning={locating} />
          </button>
        </div>
      </div>
    </div>
  );
}

function LocationIcon({ spinning }: { spinning?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden
      className={spinning ? 'animate-spin' : undefined}
    >
      <circle cx="9" cy="9" r="3" />
      <path d="M9 1v2M9 15v2M1 9h2M15 9h2" />
    </svg>
  );
}
