import { useState } from 'react'
import type { KakaoPlace } from '../types/registerFlow'

type KakaoLocalDocument = {
  id: string
  place_name: string
  address_name: string
  road_address_name: string
  phone: string
  category_name: string
  x: string // longitude
  y: string // latitude
}

type KakaoLocalResponse = {
  documents: KakaoLocalDocument[]
  meta: { total_count: number; is_end: boolean }
}

// 서울 영역 bounding box: 서남(경도,위도) ~ 동북(경도,위도)
const SEOUL_RECT = '126.734086,37.413294,127.269311,37.715133'

// 이미 "돈까스" 관련 키워드가 포함됐는지 확인
const KATSU_KEYWORDS = ['돈까스', '돈가스', '돈카츠', '커틀릿', '경양식']

function buildQuery(userQuery: string): string {
  const hasKatsu = KATSU_KEYWORDS.some((kw) => userQuery.includes(kw))
  return hasKatsu ? userQuery : `${userQuery} 돈까스`
}

function isKatsuPlace(categoryName: string): boolean {
  return KATSU_KEYWORDS.some((kw) => categoryName.includes(kw)) ||
    categoryName.includes('일식') ||
    categoryName.includes('경양식')
}

async function searchKakaoPlaces(query: string): Promise<KakaoPlace[]> {
  const key = import.meta.env.VITE_KAKAO_REST_API_KEY as string | undefined
  if (!key) throw new Error('VITE_KAKAO_REST_API_KEY 가 설정되지 않았습니다.')

  const params = new URLSearchParams({
    query: buildQuery(query),
    category_group_code: 'FD6',
    rect: SEOUL_RECT,
    size: '15',
  })
  const res = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?${params}`, {
    headers: { Authorization: `KakaoAK ${key}` },
  })

  if (!res.ok) throw new Error(`카카오 API 오류: ${res.status}`)

  const data: KakaoLocalResponse = await res.json()

  return data.documents
    .filter((doc) => isKatsuPlace(doc.category_name))
    .map((doc) => ({
      kakaoPlaceId: doc.id,
      name: doc.place_name,
      address: doc.address_name,
      roadAddress: doc.road_address_name,
      phone: doc.phone,
      category: doc.category_name,
      latitude: Number(doc.y),
      longitude: Number(doc.x),
      isRegistered: false,
    }))
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
      const places = await searchKakaoPlaces(trimmed)
      setResults(places)
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.')
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  return { results, hasSearched, isSearching, searchError, search }
}
