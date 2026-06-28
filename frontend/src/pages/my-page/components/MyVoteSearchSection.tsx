import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

type MyVoteSearchSectionProps = {
  layout: 'desktop' | 'mobile'
}

export function MyVoteSearchSection({ layout }: MyVoteSearchSectionProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const isDesktop = layout === 'desktop'

  function handleSearch() {
    if (!query.trim()) return
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#E8D9BF] bg-[#FFFDF4] p-6">
      <div className={isDesktop ? 'max-w-[60%]' : ''}>
        <h3 className={['font-black text-[#2A1A12]', isDesktop ? 'text-[18px]' : 'text-[15px]'].join(' ')}>
          다른 가게에 한 표 던져보세요!
        </h3>
        <p className="mt-1 text-[13px] text-[#5F4A3C]">
          새로운 맛집을 발견하고 순위 변동을 만들어보세요.
        </p>

        <div className={['mt-4 flex gap-2', isDesktop ? 'max-w-[420px]' : ''].join(' ')}>
          <div className="relative flex-1">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="가게명 또는 지역으로 검색"
              className="w-full rounded-xl border border-[#E8D9BF] bg-white py-2.5 pl-4 pr-10 text-[14px] text-[#2A1A12] outline-none placeholder:text-[#8A7A6A] focus:border-[#D88A24]"
            />
            <button
              type="button"
              onClick={handleSearch}
              aria-label="검색"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7A6A]"
            >
              <SearchIcon />
            </button>
          </div>
          {isDesktop && (
            <button
              type="button"
              onClick={handleSearch}
              className="shrink-0 rounded-xl bg-[#FFC533] px-5 py-2.5 text-[14px] font-black text-[#2A1A12] shadow-[0_3px_0_#C78316] transition active:translate-y-px active:shadow-none hover:bg-[#D88A24]"
            >
              검색하기
            </button>
          )}
        </div>
      </div>

      {/* 시상대 장식 (데스크탑만) */}
      {isDesktop && (
        <div className="absolute bottom-0 right-8 flex items-end gap-1" aria-hidden>
          <PodiumBlock label="2" height={52} />
          <PodiumBlock label="1" height={72} crown />
          <PodiumBlock label="3" height={40} />
        </div>
      )}
    </div>
  )
}

function PodiumBlock({ label, height, crown = false }: { label: string; height: number; crown?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {crown && (
        <svg width="20" height="16" viewBox="0 0 32 28" fill="none" aria-hidden>
          <path d="M2 22h28l2-16-8 6-8-12-8 12-8-6 2 16z" fill="#FFC533" stroke="#C78316" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="6" cy="8" r="2" fill="#C78316" />
          <circle cx="16" cy="4" r="2" fill="#C78316" />
          <circle cx="26" cy="8" r="2" fill="#C78316" />
        </svg>
      )}
      <div
        className="flex w-[44px] items-center justify-center rounded-t-md text-[16px] font-black text-white"
        style={{ height, background: crown ? '#C78316' : '#D99A4E' }}
      >
        {label}
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M13 13l3 3" />
    </svg>
  )
}
