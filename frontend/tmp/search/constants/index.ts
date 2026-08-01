import type { SearchSortOption } from '../types/searchResult'

export const SEARCH_REGION_TAGS = ['강남', '홍대', '종로', '마포', '성수'] as const

export const SEARCH_RESULTS_PER_PAGE = 10

export const SEARCH_SORT_OPTIONS: { value: SearchSortOption; label: string }[] = [
  { value: 'rank', label: '랭킹순' },
  { value: 'votes', label: '표 많은순' },
  { value: 'name', label: '이름순' },
]
