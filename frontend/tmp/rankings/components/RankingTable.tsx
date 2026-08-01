import type { RankingDetailItem } from '../types/rankingDetail'
import { RankingTableItem } from './RankingTableItem'

type RankingTableProps = {
  items: RankingDetailItem[]
  layout: 'desktop' | 'mobile'
  total?: number
  onLoadMore?: () => void
  isLoadingMore?: boolean
}

export function RankingTable({ items, layout, total, onLoadMore, isLoadingMore }: RankingTableProps) {
  const hiddenCount = (total ?? items.length) - items.length

  return (
    <div className="overflow-hidden rounded-xl border border-[#E6D5B8] bg-white shadow-[0_4px_16px_rgba(58,35,24,0.06)]">
      <ol>
        {items.map((item) => (
          <RankingTableItem key={item.id} item={item} layout={layout} />
        ))}
      </ol>

      {onLoadMore && hiddenCount > 0 && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className="flex w-full items-center justify-center gap-2 border-t border-[#E8D9BF] py-4 text-[14px] font-bold text-[#5F4A3C] transition hover:bg-[#FFF4D8] disabled:opacity-50"
        >
          {isLoadingMore ? '불러오는 중...' : `더 많은 랭킹 보기 (${items.length + 1} ~ ${total}위)`}
          {!isLoadingMore && <ChevronDownIcon />}
        </button>
      )}
    </div>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M4 6l4 4 4-4" />
    </svg>
  )
}
