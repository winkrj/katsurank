import { motion } from 'framer-motion'
import { Skeleton } from '../../../shared/ui/Skeleton'
import { useRankingQuery } from '../../../shared/queries/ranking'
import { RankBadge } from './RankBadge'

type RankingPanelProps = {
  limit?: number
  onSelectRestaurant: (id: number) => void
}

export function RankingPanel({ limit = 100, onSelectRestaurant }: RankingPanelProps) {
  const { data, isLoading, isError } = useRankingQuery(limit)

  return (
    <section className="w-full">
      <div className="overflow-hidden rounded-xl border border-[#E6D5B8] bg-white/80 shadow-[0_8px_20px_rgba(58,35,24,0.06)]">
        <div className="flex items-center justify-between border-b border-[#E6D5B8] px-5 py-4">
          <h2 className="text-[15px] font-black">실시간 랭킹 TOP {limit}</h2>
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#8A7A6A]">
            <span className="size-1.5 animate-pulse rounded-full bg-[#D88A24]" aria-hidden />
            LIVE
          </span>
        </div>

        {isLoading && (
          <ul>
            {Array.from({ length: Math.min(limit, 10) }).map((_, i) => (
              <li
                key={i}
                className="grid grid-cols-[26px_32px_1fr_auto] items-center gap-2 border-b border-[#F0E3CC] px-5 py-3 last:border-b-0"
              >
                <Skeleton className="h-5 w-5" />
                <Skeleton className="size-[30px]" />
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-10" />
              </li>
            ))}
          </ul>
        )}

        {isError && (
          <p className="py-8 text-center text-[13px] text-[#8A7A6A]">랭킹을 불러오지 못했어요.</p>
        )}

        {data && (
          <ol>
            {data.items.map((item) => (
              <motion.li
                key={item.id}
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              >
                <button
                  type="button"
                  onClick={() => onSelectRestaurant(item.id)}
                  className="grid w-full grid-cols-[26px_32px_1fr_auto] items-center gap-2 border-b border-[#F0E3CC] px-5 py-3 text-left transition last:border-b-0 hover:bg-[#FFF4D8]"
                >
                  <RankBadge rank={item.rank} />

                  <span className="flex size-[30px] items-center justify-center rounded-md border border-[#E6D5B8] bg-[#FFF4D8]">
                    <img src="/images/katsu_icon.png" alt="" className="size-full" aria-hidden />
                  </span>

                  <strong className="truncate text-[14px] font-bold">{item.name}</strong>

                  <span className="text-[12px] font-bold text-[#5F4A3C]">
                    {item.voteCount.toLocaleString()}표
                  </span>
                </button>
              </motion.li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
