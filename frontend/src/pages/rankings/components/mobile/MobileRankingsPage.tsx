import { useState } from 'react'
import { Skeleton } from '../../../../shared/ui/Skeleton'
import { useRankingQuery } from '../../../../shared/queries/ranking'
import type { PeriodKey, RegionFilterKey } from '../../types/rankingDetail'
import { RankingBanner } from '../RankingBanner'
import { RankingFilterBar } from '../RankingFilterBar'
import { RankingPromoSection } from '../RankingPromoSection'
import { RankingTable } from '../RankingTable'

export function MobileRankingsPage() {
  const [region, setRegion] = useState<RegionFilterKey>('all')
  const [period, setPeriod] = useState<PeriodKey>('weekly')

  const { data, isLoading, isError } = useRankingQuery(100)

  const items = data?.map((item) => ({
    id: item.restaurantId,
    rank: item.rank,
    name: item.restaurantName,
    address: '',
    votes: item.voteCount,
  })) ?? []

  return (
    <main className="min-h-screen bg-[#FFFDF4] pb-[68px] pt-14 text-[#2A1A12]">
      <RankingBanner layout="mobile" />
      <RankingFilterBar
        region={region}
        period={period}
        onRegionChange={setRegion}
        onPeriodChange={setPeriod}
        layout="mobile"
      />

      <div className="px-4 py-4">
        {isLoading && (
          <div className="space-y-0 overflow-hidden rounded-xl border border-[#E6D5B8] bg-white">
            {Array.from({ length: 10 }).map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key
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
          <RankingTable items={items} layout="mobile" />
        )}
      </div>

      <RankingPromoSection layout="mobile" />
    </main>
  )
}
