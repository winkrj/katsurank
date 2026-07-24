type MapSearchBarProps = {
  className?: string
}

export function MapSearchBar({ className = '' }: MapSearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <input
        type="search"
        placeholder="가게명 검색"
        className="w-full rounded-xl border border-[#E8D9BF] bg-white py-2.5 pl-4 pr-10 text-[14px] text-[#2A1A12] outline-none placeholder:text-[#8A7A6A] focus:border-[#D88A24] focus:ring-2 focus:ring-[#D88A24]/20"
      />
      <button
        type="button"
        aria-label="검색"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7A6A]"
      >
        <SearchIcon />
      </button>
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
