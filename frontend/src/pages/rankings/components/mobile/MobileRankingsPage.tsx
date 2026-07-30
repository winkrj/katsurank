import { useState } from 'react'
import { RANKING_PREVIEW_COUNT } from '../../constants'
import { Skeleton } from '../../../../shared/ui/Skeleton'
import { useRankingQuery } from '../../../../shared/queries/ranking'
import { RankingBanner } from '../RankingBanner'
import { RankingPromoSection } from '../RankingPromoSection'
import { RankingTable } from '../RankingTable'

export function MobileRankingsPage() {
  const [limit, setLimit] = useState(RANKING_PREVIEW_COUNT)
  const { data, isLoading, isFetching, isError } = useRankingQuery(limit)

  const items = data?.items.map((item) => ({
    id: item.id,
    rank: item.rank,
    name: item.name,
    address: item.address,
    votes: item.voteCount,
  })) ?? []

  return (
    <main className="min-h-screen bg-[#FFFDF4] pb-[68px] pt-14 text-[#2A1A12]">
      <RankingBanner layout="mobile" />
      {/* TODO: 2차 -> 지역/기간 필터 API 나오면 RankingFilterBar 복원 */}

      <div className="px-4 py-4">
        {isLoading && (
          <div className="space-y-0 overflow-hidden rounded-xl border border-[#E6D5B8] bg-white">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-[#F0E3CC] px-4 py-3 last:border-b-0">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="size-[52px] rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        )}
        {isError && (
          <p className="py-12 text-center text-[14px] text-[#8A7A6A]">랭킹을 불러오지 못했어요.</p>
        )}
        {!isLoading && !isError && (
          <RankingTable
            items={items}
            layout="mobile"
            total={data?.total}
            isLoadingMore={isFetching}
            onLoadMore={data?.total ? () => setLimit(data.total) : undefined}
          />
        )}
      </div>

      <RankingPromoSection layout="mobile" />
    </main>
  )
}
