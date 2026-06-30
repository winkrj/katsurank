import { useEffect, useRef } from 'react';
import { MAP_DEFAULT_LEVEL, SEOUL_CENTER } from '../constants';
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
    // 이미 SDK 로딩 중인 경우: 콜백만 추가
    const existingScript = document.querySelector('script[src^="//dapi.kakao.com/v2/maps/sdk.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => window.kakao.maps.load(resolve));
      existingScript.addEventListener('error', reject);
      return;
    }
    // 새로 추가
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
  const overlaysRef = useRef<Map<number, kakao.maps.CustomOverlay>>(new Map());

  // 지도 + 핀 초기화
  useEffect(() => {
    const appkey = import.meta.env.VITE_KAKAO_MAP_APP_KEY as string | undefined;
    if (!containerRef.current || !appkey) return;

    let cancelled = false;

    loadKakaoSdk(appkey).then(() => {
      if (cancelled || !containerRef.current) return;

      const { maps } = window.kakao;
      const center = new maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng);
      const map = new maps.Map(containerRef.current, { center, level: MAP_DEFAULT_LEVEL });

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
    });

    return () => {
      cancelled = true;
      const overlays = overlaysRef.current;
      overlays.forEach((o) => o.setMap(null));
      overlays.clear();
    };
  }, [restaurants]); // eslint-disable-line react-hooks/exhaustive-deps

  // 선택 변경 시 핀 스타일만 업데이트
  useEffect(() => {
    overlaysRef.current.forEach((overlay, id) => {
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

  return <div id="map" ref={containerRef} className={`w-full ${className}`} />;
}
