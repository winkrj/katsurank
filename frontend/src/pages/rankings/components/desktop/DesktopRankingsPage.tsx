import { useState } from 'react'
import { MOCK_RANKING_LIST } from '../../mocks/rankings.mock'
import type { PeriodKey, RegionFilterKey } from '../../types/rankingDetail'
import { RankingBanner } from '../RankingBanner'
import { RankingFilterBar } from '../RankingFilterBar'
import { RankingGuideCard } from '../RankingGuideCard'
import { RankingPromoSection } from '../RankingPromoSection'
import { RankingTable } from '../RankingTable'

export function DesktopRankingsPage() {
  const [region, setRegion] = useState<RegionFilterKey>('all')
  const [period, setPeriod] = useState<PeriodKey>('weekly')

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
        {/* 좌측 가이드 */}
        <div className="w-[180px] shrink-0">
          <RankingGuideCard />
        </div>

        {/* 우측 랭킹 리스트 */}
        <div className="min-w-0 flex-1">
          <RankingTable items={MOCK_RANKING_LIST} layout="desktop" />
        </div>
      </div>

      <RankingPromoSection layout="desktop" />
    </div>
  )
}
