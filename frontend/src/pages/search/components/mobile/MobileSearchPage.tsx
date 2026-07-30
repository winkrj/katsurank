import { useState } from 'react'
import { SEARCH_RESULTS_PER_PAGE } from '../../constants'
import { Pagination } from '../../../../shared/ui/Pagination'
import { useRestaurantSearchQuery } from '../../../../shared/queries/restaurants'
import type { SearchResultItem, SearchSortOption } from '../../types/searchResult'
import { SearchBanner } from '../SearchBanner'
import { SearchForm } from '../SearchForm'
import { SearchRegisterCard } from '../SearchRegisterCard'
import { SearchResultList } from '../SearchResultList'
import { SearchResultsHeader } from '../SearchResultsHeader'

export function MobileSearchPage() {
  const [inputQuery, setInputQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [sort, setSort] = useState<SearchSortOption>('rank')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useRestaurantSearchQuery(
    submittedQuery,
    SEARCH_RESULTS_PER_PAGE,
    (page - 1) * SEARCH_RESULTS_PER_PAGE,
  )
  const apiResults = data?.items ?? []
  const total = data?.total ?? 0

  const results: SearchResultItem[] = apiResults.map((r) => ({
    id: r.id,
    rank: r.rank ?? 0,
    name: r.name,
    address: r.address,
    category: '일식 돈까스',
    votes: r.voteCount,
    image: '/images/shop_default_img.png',
  }))

  const sorted = [...results].sort((a, b) => {
    if (sort === 'votes') return b.votes - a.votes
    if (sort === 'name') return a.name.localeCompare(b.name, 'ko')
    return (a.rank || 9999) - (b.rank || 9999)
  })

  const totalPages = Math.max(1, Math.ceil(total / SEARCH_RESULTS_PER_PAGE))

  function handleSearch() {
    setSubmittedQuery(inputQuery)
    setPage(1)
  }

  return (
    <main className="bg-[#FFFDF4] pb-[68px] pt-14 text-[#2A1A12]">
      <SearchBanner layout="mobile" />

      <div className="space-y-4 px-4 py-5">
        <SearchForm
          query={inputQuery}
          onQueryChange={setInputQuery}
          onSubmit={handleSearch}
          layout="mobile"
        />
        <SearchResultsHeader
          total={total}
          sort={sort}
          onSortChange={setSort}
        />
        <SearchResultList
          items={sorted}
          layout="mobile"
          hasQuery={Boolean(submittedQuery.trim())}
          isLoading={isLoading}
        />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          ariaLabel="검색 결과 페이지"
        />
        <SearchRegisterCard layout="mobile" />
      </div>
    </main>
  )
}
