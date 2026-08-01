import { PERIOD_OPTIONS, REGION_FILTERS } from '../constants'
import type { PeriodKey, RegionFilterKey } from '../types/rankingDetail'

type RankingFilterBarProps = {
  region: RegionFilterKey
  period: PeriodKey
  onRegionChange: (key: RegionFilterKey) => void
  onPeriodChange: (key: PeriodKey) => void
  layout?: 'desktop' | 'mobile'
}

export function RankingFilterBar({
  region,
  period,
  onRegionChange,
  onPeriodChange,
  layout = 'desktop',
}: RankingFilterBarProps) {
  const isMobile = layout === 'mobile'

  return (
    <div
      className={[
        'flex items-center gap-3 border-b border-[#E8D9BF] bg-[#FFFDF4]',
        isMobile ? 'flex-col px-4 py-2' : 'px-6 py-3',
      ].join(' ')}
    >
      {/* 지역 탭 */}
      <div
        className={[
          'flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden',
          isMobile ? 'w-full' : 'flex-1',
        ].join(' ')}
        style={{ scrollbarWidth: 'none' }}
      >
        {REGION_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onRegionChange(key)}
            className={[
              'shrink-0 rounded-full px-4 py-1.5 text-[13px] font-bold transition-colors',
              region === key
                ? 'bg-[#FFC533] text-[#2A1A12]'
                : 'text-[#5F4A3C] hover:bg-[#F5EDD8]',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 기간 + 랭킹 기준 */}
      <div className={['flex shrink-0 items-center gap-3', isMobile ? 'w-full' : ''].join(' ')}>
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as PeriodKey)}
          className="rounded-lg border border-[#E8D9BF] bg-white px-3 py-1.5 text-[13px] font-bold text-[#2A1A12] outline-none focus:border-[#D88A24]"
        >
          {PERIOD_OPTIONS.map(({ key, label }) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="flex items-center gap-1 text-[13px] font-bold text-[#5F4A3C]"
        >
          랭킹 기준
          <span className="flex size-4 items-center justify-center rounded-full border border-[#8A7A6A] text-[11px] text-[#8A7A6A]">
            ?
          </span>
        </button>
      </div>
    </div>
  )
}
