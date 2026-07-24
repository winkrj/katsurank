import { useState } from 'react';
import { searchKakaoPlacesProxy, type KakaoPlaceDto } from '../../../shared/api/kakaoPlaces';
import type { KakaoPlace } from '../types/registerFlow';

function toKakaoPlace(dto: KakaoPlaceDto): KakaoPlace {
  return {
    kakaoPlaceId: dto.kakaoPlaceId,
    name: dto.name,
    address: dto.address,
    roadAddress: dto.roadAddress,
    phone: dto.phone,
    category: dto.category,
    placeUrl: dto.placeUrl,
    latitude: dto.latitude,
    longitude: dto.longitude,
    isRegistered: false,
  };
}

export function useKakaoPlaceSearch() {
  const [results, setResults] = useState<KakaoPlace[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastQuery, setLastQuery] = useState('');

  async function search(query: string, targetPage = 1) {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const data = await searchKakaoPlacesProxy(trimmed, targetPage);
      setResults(data.places.map(toKakaoPlace));
      setPage(data.page);
      setTotalPages(Math.max(1, data.totalPages));
      setLastQuery(trimmed);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.');
      setResults([]);
      setTotalPages(1);
    } finally {
      setIsSearching(false);
    }
  }

  function goToPage(targetPage: number) {
    if (!lastQuery) return;
    search(lastQuery, targetPage);
  }

  return { results, hasSearched, isSearching, searchError, page, totalPages, search, goToPage };
}
