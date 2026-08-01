import { useMemo, useRef, useState } from 'react'
import type { MapRestaurant } from '../types/map'

type MapSearchBarProps = {
  restaurants: MapRestaurant[]
  onSelect: (restaurant: MapRestaurant) => void
  className?: string
}

const MAX_RESULTS = 6

export function MapSearchBar({ restaurants, onSelect, className = '' }: MapSearchBarProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const results = useMemo(() => {
    const trimmed = query.trim()
    if (!trimmed) return []
    return restaurants
      .filter((r) => r.name.toLowerCase().includes(trimmed.toLowerCase()))
      .slice(0, MAX_RESULTS)
  }, [query, restaurants])

  const showDropdown = isFocused && query.trim().length > 0

  function handleSelect(restaurant: MapRestaurant) {
    onSelect(restaurant)
    setQuery('')
    setIsFocused(false)
  }

  return (
    <div className={`relative ${className}`}>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          // 리스트 항목 클릭이 blur보다 먼저 처리되도록 살짝 지연 후 닫는다.
          blurTimeoutRef.current = setTimeout(() => setIsFocused(false), 120)
        }}
        placeholder="가게명 검색"
        className="w-full rounded-xl border border-[#E8D9BF] bg-white py-2.5 pl-4 pr-10 text-[14px] text-[#2A1A12] shadow-[0_8px_24px_rgba(42,26,18,0.18)] outline-none placeholder:text-[#8A7A6A] focus:border-[#D88A24] focus:ring-2 focus:ring-[#D88A24]/20"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7A6A]">
        <SearchIcon />
      </span>

      {showDropdown && (
        <ul className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-[280px] overflow-y-auto rounded-xl border border-[#E8D9BF] bg-white py-1 shadow-lg">
          {results.length > 0 ? (
            results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(r)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-[14px] text-[#2A1A12] hover:bg-[#FFF4D8]"
                >
                  <span className="truncate">{r.name}</span>
                  <span className="shrink-0 text-[12px] text-[#8A7A6A]">{r.votes.toLocaleString()}표</span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-4 py-2.5 text-[13px] text-[#8A7A6A]">검색 결과가 없어요.</li>
          )}
        </ul>
      )}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M13 13l3 3" />
    </svg>
  )
}
