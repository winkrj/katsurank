import { Link } from 'react-router-dom'
import { Skeleton } from '../../../shared/ui/Skeleton'
import { useRankingQuery } from '../../../shared/queries/ranking'
import { RankBadge } from './RankBadge'

type RankingListProps = {
  layout?: 'default' | 'mobile'
  limit?: number
}

const RANKING_LIMIT = {
  default: 5,
  mobile: 10,
} as const

export function RankingList({ layout = 'default', limit: limitProp }: RankingListProps) {
  const isMobileLayout = layout === 'mobile'
  const limit = limitProp ?? RANKING_LIMIT[layout]
  const { data, isLoading, isError } = useRankingQuery(limit)

  return (
    <section className="w-full">
      <div className="overflow-hidden rounded-xl border border-[#E6D5B8] bg-white/80 shadow-[0_8px_20px_rgba(58,35,24,0.06)]">
        <div
          className={
            isMobileLayout
              ? 'mobile-hero__ranking-header flex items-center justify-between border-b border-[#E6D5B8]'
              : 'flex items-center justify-between border-b border-[#E6D5B8] px-5 py-4'
          }
        >
          <h2
            className={
              isMobileLayout ? 'mobile-hero__ranking-title font-black' : 'text-[15px] font-black'
            }
          >
            실시간 랭킹 TOP {limit}
          </h2>
          <Link
            to="/rankings"
            className={
              isMobileLayout
                ? 'mobile-hero__ranking-link font-bold text-[#7A431D]'
                : 'text-[12px] font-bold text-[#7A431D]'
            }
          >
            전체보기 〉
          </Link>
        </div>

        {isLoading && (
          <ul>
            {Array.from({ length: limit }).map((_, i) => (
              <li
                key={i}
                className={
                  isMobileLayout
                    ? 'mobile-hero__ranking-row grid grid-cols-[auto_auto_1fr_auto] items-center border-b border-[#F0E3CC] last:border-b-0'
                    : 'grid grid-cols-[26px_32px_1fr_auto] items-center gap-2 border-b border-[#F0E3CC] px-5 py-3 last:border-b-0'
                }
              >
                <Skeleton className={isMobileLayout ? 'mobile-hero__rank-badge' : 'h-5 w-5'} />
                <Skeleton className={isMobileLayout ? 'mobile-hero__ranking-icon' : 'size-[30px]'} />
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
              <li key={item.id}>
                <Link
                  to={`/restaurants/${item.id}`}
                  className={
                    isMobileLayout
                      ? 'mobile-hero__ranking-row grid grid-cols-[auto_auto_1fr_auto] items-center border-b border-[#F0E3CC] transition last:border-b-0 hover:bg-[#FFF4D8]'
                      : 'grid grid-cols-[26px_32px_1fr_auto] items-center gap-2 border-b border-[#F0E3CC] px-5 py-3 transition last:border-b-0 hover:bg-[#FFF4D8]'
                  }
                >
                  <RankBadge
                    rank={item.rank}
                    className={isMobileLayout ? 'mobile-hero__rank-badge' : undefined}
                  />

                  <span
                    className={
                      isMobileLayout
                        ? 'mobile-hero__ranking-icon flex items-center justify-center rounded-md border border-[#E6D5B8] bg-[#FFF4D8]'
                        : 'flex size-[30px] items-center justify-center rounded-md border border-[#E6D5B8] bg-[#FFF4D8]'
                    }
                  >
                    <img src="/images/katsu_icon.png" alt="" className="size-full" aria-hidden />
                  </span>

                  <strong
                    className={
                      isMobileLayout
                        ? 'mobile-hero__ranking-name truncate font-bold'
                        : 'truncate text-[14px] font-bold'
                    }
                  >
                    {item.name}
                  </strong>

                  <span
                    className={
                      isMobileLayout
                        ? 'mobile-hero__ranking-votes font-bold text-[#5F4A3C]'
                        : 'text-[12px] font-bold text-[#5F4A3C]'
                    }
                  >
                    {item.voteCount.toLocaleString()}표
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
