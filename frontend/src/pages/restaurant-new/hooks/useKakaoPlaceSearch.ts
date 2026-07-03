import { useState } from 'react'
import { searchKakaoPlacesProxy } from '../../../shared/api/kakaoPlaces'
import type { KakaoPlace } from '../types/registerFlow'

function toKakaoPlace(dto: Awaited<ReturnType<typeof searchKakaoPlacesProxy>>[number]): KakaoPlace {
  return {
    kakaoPlaceId: dto.kakaoPlaceId,
    name: dto.name,
    address: dto.addressName,
    roadAddress: dto.roadAddressName,
    phone: dto.phone,
    category: dto.categoryName,
    latitude: dto.latitude,
    longitude: dto.longitude,
    isRegistered: dto.isRegistered,
    registeredRestaurantId: dto.registeredRestaurantId,
  }
}

export function useKakaoPlaceSearch() {
  const [results, setResults] = useState<KakaoPlace[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  async function search(query: string) {
    const trimmed = query.trim()
    if (!trimmed) return

    setIsSearching(true)
    setSearchError(null)
    setHasSearched(true)

    try {
      const dtos = await searchKakaoPlacesProxy(trimmed)
      setResults(dtos.map(toKakaoPlace))
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.')
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  return { results, hasSearched, isSearching, searchError, search }
}
