import type { FormEvent } from 'react'
// TODO: 2차 -> 지역(장소) 검색 지원 시 SEARCH_REGION_TAGS 다시 사용
// import { SEARCH_REGION_TAGS } from '../constants'

type SearchFormProps = {
  query: string
  onQueryChange: (value: string) => void
  onSubmit: () => void
  layout?: 'desktop' | 'mobile'
}

export function SearchForm({
  query,
  onQueryChange,
  onSubmit,
  layout = 'desktop',
}: SearchFormProps) {
  const isMobile = layout === 'mobile'

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <section
      className={
        isMobile
          ? 'rounded-2xl border border-[#E8D9BF] bg-white p-4 shadow-[0_8px_20px_rgba(58,35,24,0.05)]'
          : 'rounded-2xl border border-[#E8D9BF] bg-white p-5 shadow-[0_8px_24px_rgba(58,35,24,0.06)]'
      }
    >
      <h2 className="mb-4 text-[16px] font-black text-[#2A1A12]">검색하기</h2>

      <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="가게명을 입력하세요"
          className="h-11 min-w-0 flex-1 rounded-lg border border-[#E8D9BF] bg-[#FFFDF4] px-3 text-[14px] text-[#2A1A12] outline-none placeholder:text-[#8A7A6A] focus:border-[#D88A24]"
        />
        <button
          type="submit"
          className="flex size-11 shrink-0 items-center justify-center rounded-lg border-2 border-[#DBBA24] bg-[#FFC533] text-[#2A1A12] transition hover:brightness-[0.98]"
          aria-label="검색"
        >
          <SearchIcon />
        </button>
      </form>

      {/* TODO: 2차 -> 지역(장소) 검색 API 나오면 주석 해제
      <div className="flex flex-wrap gap-2">
        {SEARCH_REGION_TAGS.map((tag) => {
          const isActive = selectedTag === tag
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onTagSelect(isActive ? null : tag)}
              className={[
                'rounded-full border px-3 py-1.5 text-[13px] font-bold transition',
                isActive
                  ? 'border-[#DBBA24] bg-[#FFC533] text-[#2A1A12]'
                  : 'border-[#E8D9BF] bg-[#FFFDF4] text-[#5F4A3C] hover:border-[#D88A24]',
              ].join(' ')}
            >
              {tag}
            </button>
          )
        })}
      </div>
      */}
    </section>
  )
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M13.5 13.5 17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
