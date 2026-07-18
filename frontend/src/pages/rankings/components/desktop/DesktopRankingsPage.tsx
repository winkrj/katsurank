import { useState } from 'react'
import { Skeleton } from '../../../../shared/ui/Skeleton'
import { useRankingQuery } from '../../../../shared/queries/ranking'
import type { PeriodKey, RegionFilterKey } from '../../types/rankingDetail'
import { RankingBanner } from '../RankingBanner'
import { RankingFilterBar } from '../RankingFilterBar'
import { RankingGuideCard } from '../RankingGuideCard'
import { RankingPromoSection } from '../RankingPromoSection'
import { RankingTable } from '../RankingTable'

export function DesktopRankingsPage() {
  const [region, setRegion] = useState<RegionFilterKey>('all')
  const [period, setPeriod] = useState<PeriodKey>('weekly')

  const { data, isLoading, isError } = useRankingQuery(100)

  const items = data?.items.map((item) => ({
    id: item.id,
    rank: item.rank,
    name: item.name,
    address: item.address,
    votes: item.voteCount,
  })) ?? []

  return (
    <div className="min-h-screen bg-[#FFFDF4] pt-20 text-[#2A1A12]">
      <RankingBanner layout="desktop" />
      <RankingFilterBar
        region={region}
        period={period}
        onRegionChange={setRegion}
        onPeriodChange={setPeriod}
        layout="desktop"
      />

      <div className="mx-auto flex max-w-[1080px] gap-5 px-6 py-6">
        <div className="w-[240px] shrink-0">
          <RankingGuideCard />
        </div>

        <div className="min-w-0 flex-1">
          {isLoading && (
            <div className="space-y-2 overflow-hidden rounded-xl border border-[#E6D5B8] bg-white">
              {Array.from({ length: 10 }).map((_, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={i} className="flex items-center gap-5 border-b border-[#F0E3CC] px-6 py-4 last:border-b-0">
                  <Skeleton className="size-11 rounded-full" />
                  <Skeleton className="h-[90px] w-[120px] rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          )}
          {isError && (
            <p className="py-12 text-center text-[14px] text-[#8A7A6A]">랭킹을 불러오지 못했어요.</p>
          )}
          {!isLoading && !isError && (
            <RankingTable items={items} layout="desktop" />
          )}
        </div>
      </div>

      <RankingPromoSection layout="desktop" />
    </div>
  )
}
