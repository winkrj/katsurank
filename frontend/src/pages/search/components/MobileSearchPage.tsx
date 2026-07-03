import { useState } from 'react'
import { SEARCH_RESULTS_PER_PAGE } from '../constants'
import { useRestaurantSearchQuery } from '../../../shared/queries/restaurants'
import type { SearchResultItem, SearchSortOption } from '../types/searchResult'
import { SearchBanner } from './SearchBanner'
import { SearchForm } from './SearchForm'
import { SearchPagination } from './SearchPagination'
import { SearchRegisterCard } from './SearchRegisterCard'
import { SearchResultList } from './SearchResultList'
import { SearchResultsHeader } from './SearchResultsHeader'

export function MobileSearchPage() {
  const [inputQuery, setInputQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [sort, setSort] = useState<SearchSortOption>('rank')
  const [page, setPage] = useState(1)

  const { data: apiResults = [], isLoading } = useRestaurantSearchQuery(submittedQuery)

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

  const totalPages = Math.max(1, Math.ceil(sorted.length / SEARCH_RESULTS_PER_PAGE))
  const paginatedResults = sorted.slice(
    (page - 1) * SEARCH_RESULTS_PER_PAGE,
    page * SEARCH_RESULTS_PER_PAGE,
  )

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
          selectedTag={selectedTag}
          onQueryChange={setInputQuery}
          onTagSelect={setSelectedTag}
          onSubmit={handleSearch}
          layout="mobile"
        />
        <SearchRegisterCard layout="mobile" />
        <SearchResultsHeader
          total={sorted.length}
          sort={sort}
          onSortChange={setSort}
        />
        <SearchResultList
          items={paginatedResults}
          layout="mobile"
          hasQuery={Boolean(submittedQuery.trim() || selectedTag)}
          isLoading={isLoading}
        />
        <SearchPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </main>
  )
}
