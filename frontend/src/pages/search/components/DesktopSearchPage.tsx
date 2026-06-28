import { useMemo, useState } from 'react'
import { MOCK_SEARCH_TOTAL_COUNT, SEARCH_RESULTS_PER_PAGE } from '../constants'
import { MOCK_SEARCH_RESULTS } from '../mocks/searchResults.mock'
import type { SearchSortOption } from '../types/searchResult'
import { SearchBanner } from './SearchBanner'
import { SearchForm } from './SearchForm'
import { SearchPagination } from './SearchPagination'
import { SearchRegisterCard } from './SearchRegisterCard'
import { SearchResultList } from './SearchResultList'
import { SearchResultsHeader } from './SearchResultsHeader'

export function DesktopSearchPage() {
  const [query, setQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [sort, setSort] = useState<SearchSortOption>('rank')
  const [page, setPage] = useState(1)

  const filteredResults = useMemo(() => {
    let results = [...MOCK_SEARCH_RESULTS]

    if (query.trim()) {
      const keyword = query.trim().toLowerCase()
      results = results.filter(
        (item) =>
          item.name.toLowerCase().includes(keyword) ||
          item.address.toLowerCase().includes(keyword),
      )
    }

    if (selectedTag) {
      results = results.filter((item) => item.address.includes(selectedTag))
    }

    if (sort === 'votes') {
      results.sort((a, b) => b.votes - a.votes)
    } else if (sort === 'name') {
      results.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    } else {
      results.sort((a, b) => a.rank - b.rank)
    }

    return results
  }, [query, selectedTag, sort])

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / SEARCH_RESULTS_PER_PAGE))
  const paginatedResults = filteredResults.slice(
    (page - 1) * SEARCH_RESULTS_PER_PAGE,
    page * SEARCH_RESULTS_PER_PAGE,
  )

  function handleSearch() {
    setPage(1)
  }

  return (
    <main className="bg-[#FFFDF4] pt-20 text-[#2A1A12]">
      <SearchBanner layout="desktop" />

      <div className="mx-auto max-w-[1280px] px-8 py-8">
        <div className="grid grid-cols-[minmax(280px,320px)_minmax(0,1fr)] gap-8">
          <aside>
            <SearchForm
              query={query}
              selectedTag={selectedTag}
              onQueryChange={setQuery}
              onTagSelect={setSelectedTag}
              onSubmit={handleSearch}
            />
            <SearchRegisterCard />
          </aside>

          <section>
            <SearchResultsHeader
              total={query || selectedTag ? filteredResults.length : MOCK_SEARCH_TOTAL_COUNT}
              sort={sort}
              onSortChange={setSort}
            />
            <SearchResultList
              items={paginatedResults}
              layout="desktop"
              hasQuery={Boolean(query.trim() || selectedTag)}
            />
            <SearchPagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </section>
        </div>
      </div>
    </main>
  )
}
