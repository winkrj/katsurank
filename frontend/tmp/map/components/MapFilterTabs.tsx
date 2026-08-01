import { MAP_FILTERS } from '../constants'
import type { MapFilterKey } from '../types/map'

type MapFilterTabsProps = {
  active: MapFilterKey
  onChange: (key: MapFilterKey) => void
  className?: string
}

export function MapFilterTabs({ active, onChange, className = '' }: MapFilterTabsProps) {
  return (
    <div className={`flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden ${className}`} style={{ scrollbarWidth: 'none' }}>
      {MAP_FILTERS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={[
            'shrink-0 rounded-full border px-4 py-2 text-[13px] font-bold transition-colors',
            active === key
              ? 'border-[#2A1A12] bg-[#2A1A12] text-white'
              : 'border-[#E8D9BF] bg-white text-[#2A1A12] hover:border-[#D88A24]',
          ].join(' ')}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
