import type { FormEvent } from 'react'
import { Pagination } from '../../../shared/ui/Pagination'
import { KakaoPlaceResultList } from './KakaoPlaceResultList'
import type { KakaoPlace } from '../types/registerFlow'

type RegisterStepSearchProps = {
  query: string
  results: KakaoPlace[]
  isSearching?: boolean
  searchError?: string | null
  page: number
  totalPages: number
  onQueryChange: (value: string) => void
  onSearch: (query: string) => void
  onSelect: (place: KakaoPlace) => void
  onPageChange: (page: number) => void
}

export function RegisterStepSearch({
  query,
  results,
  isSearching = false,
  searchError = null,
  page,
  totalPages,
  onQueryChange,
  onSearch,
  onSelect,
  onPageChange,
}: RegisterStepSearchProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSearch(query)
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-[17px] font-black text-[#2A1A12]">Step 1. 가게 검색</h2>
        <p className="mt-1 text-[13px] text-[#8A7A6A]">
          현재 <span className="font-bold text-[#D88A24]">서울 지역 돈까스 가게</span>만 등록할 수 있어요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="가게 이름 또는 주소 검색"
          className="h-11 min-w-0 flex-1 rounded-lg border border-[#E8D9BF] bg-[#FFFDF4] px-3 text-[14px] outline-none placeholder:text-[#8A7A6A] focus:border-[#D88A24]"
        />
        <button
          type="submit"
          className="flex size-11 shrink-0 items-center justify-center rounded-lg border-2 border-[#DBBA24] bg-[#FFC533]"
          aria-label="검색"
        >
          <SearchIcon />
        </button>
      </form>

      {isSearching && (
        <p className="text-center text-[13px] text-[#8A7A6A]">검색 중...</p>
      )}

      {searchError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-600">{searchError}</p>
      )}

      {!isSearching && !searchError && (
        <>
          <KakaoPlaceResultList places={results} onSelect={onSelect} />
          {results.length > 0 && totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
              ariaLabel="검색 결과 페이지"
            />
          )}
        </>
      )}

      <p className="text-[12px] leading-relaxed text-[#8A7A6A]">
        가게 정보는 카카오맵 API를 통해 제공됩니다. 등록 후 다른 사용자에게 공개됩니다.
      </p>
    </section>
  )
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="5.5" stroke="#2A1A12" strokeWidth="1.8" />
      <path d="M13.5 13.5 17 17" stroke="#2A1A12" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
