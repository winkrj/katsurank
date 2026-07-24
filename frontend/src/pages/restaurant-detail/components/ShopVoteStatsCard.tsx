import type { ReactNode } from 'react'
import type { RestaurantDetail } from '../types/restaurantDetail'
// TODO: 2차 -> 일별 투표 추이 API 나오면 ShopVoteTrendChart 복원
// import { ShopVoteTrendChart } from './ShopVoteTrendChart'

type ShopVoteStatsCardProps = {
  restaurant: RestaurantDetail
  showDots?: boolean
  children?: ReactNode
}

export function ShopVoteStatsCard({
  restaurant,
  children,
}: ShopVoteStatsCardProps) {
  return (
    <section className="rounded-2xl border border-[#E8D9BF] bg-white p-5 shadow-[0_8px_20px_rgba(58,35,24,0.06)]">
      <div className="space-y-1">
        <p className="text-[28px] font-black leading-none text-[#2A1A12]">
          {restaurant.totalVotes.toLocaleString()}표
        </p>
        <p className="text-[13px] text-[#8A7A6A]">전체 투표 수</p>
      </div>

      {/* TODO: 2차 -> 일별 투표 추이 API 나오면 복원
      <div className="mb-4 mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-[#3D7A4A]">
        <TrendUpIcon />
        최근 7일 ▲ {restaurant.weeklyVoteDelta.toLocaleString()}표
      </div>
      <ShopVoteTrendChart data={restaurant.voteTrend} showDots={showDots} />
      */}

      {children}
    </section>
  )
}
