import type { ReactNode } from 'react'
import type { RestaurantDetail } from '../types/restaurantDetail'
import { ShopVoteTrendChart } from './ShopVoteTrendChart'

type ShopVoteStatsCardProps = {
  restaurant: RestaurantDetail
  showDots?: boolean
  children?: ReactNode
}

export function ShopVoteStatsCard({
  restaurant,
  showDots = false,
  children,
}: ShopVoteStatsCardProps) {
  return (
    <section className="rounded-2xl border border-[#E8D9BF] bg-white p-5 shadow-[0_8px_20px_rgba(58,35,24,0.06)]">
      <div className="mb-3 space-y-1">
        <p className="text-[28px] font-black leading-none text-[#2A1A12]">
          {restaurant.totalVotes.toLocaleString()}표
        </p>
        <p className="text-[13px] text-[#8A7A6A]">전체 투표 수</p>
      </div>

      <div className="mb-4 flex items-center gap-1.5 text-[13px] font-semibold text-[#3D7A4A]">
        <TrendUpIcon />
        최근 7일 ▲ {restaurant.weeklyVoteDelta.toLocaleString()}표
      </div>

      <ShopVoteTrendChart data={restaurant.voteTrend} showDots={showDots} />

      {children}
    </section>
  )
}

function TrendUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2 10 6 6l2.5 2.5L12 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.5 3H12v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
