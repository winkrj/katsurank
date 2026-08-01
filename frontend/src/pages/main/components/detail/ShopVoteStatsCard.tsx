import type { ReactNode } from 'react'
import type { RestaurantDetail } from '../../types/restaurantDetail'

type ShopVoteStatsCardProps = {
  restaurant: RestaurantDetail
  children?: ReactNode
}

export function ShopVoteStatsCard({ restaurant, children }: ShopVoteStatsCardProps) {
  return (
    <section className="rounded-2xl border border-[#E8D9BF] bg-white p-5 shadow-[0_8px_20px_rgba(58,35,24,0.06)]">
      <div className="space-y-1">
        <p className="text-[28px] font-black leading-none text-[#2A1A12]">
          {restaurant.totalVotes.toLocaleString()}표
        </p>
        <p className="text-[13px] text-[#8A7A6A]">전체 투표 수</p>
      </div>

      {children}
    </section>
  )
}
