import { useState } from 'react'
import { MOCK_RANKING_LIST } from '../../mocks/rankings.mock'
import type { PeriodKey, RegionFilterKey } from '../../types/rankingDetail'
import { RankingBanner } from '../RankingBanner'
import { RankingFilterBar } from '../RankingFilterBar'
import { RankingPromoSection } from '../RankingPromoSection'
import { RankingTable } from '../RankingTable'

export function MobileRankingsPage() {
  const [region, setRegion] = useState<RegionFilterKey>('all')
  const [period, setPeriod] = useState<PeriodKey>('weekly')

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
        <RankingTable items={MOCK_RANKING_LIST} layout="mobile" />
      </div>

      <RankingPromoSection layout="mobile" />
    </main>
  )
}
