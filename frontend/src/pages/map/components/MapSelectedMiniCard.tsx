import { Link } from 'react-router-dom'
import { RestaurantVoteConfirmButton } from '../../restaurant-detail/components/RestaurantVoteConfirmButton'
import type { MapRestaurant } from '../types/map'

type MapSelectedMiniCardProps = {
  restaurant: MapRestaurant
  onClose: () => void
}

export function MapSelectedMiniCard({ restaurant: r, onClose }: MapSelectedMiniCardProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 rounded-t-2xl border-t border-[#E8D9BF] bg-white shadow-[0_-4px_20px_rgba(42,26,18,0.12)]">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="h-[64px] w-[64px] shrink-0 overflow-hidden rounded-xl border border-[#E8D9BF] bg-[#E8D9BF]">
          <img src={r.image} alt={r.name} className="size-full object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {r.rank === 1 && <CrownIcon />}
            <span className="truncate text-[15px] font-black text-[#2A1A12]">{r.name}</span>
          </div>
          <p className="truncate text-[12px] text-[#5F4A3C]">{r.shortAddress}</p>
          <p className="mt-0.5 text-[13px] font-bold text-[#2A1A12]">
            {r.votes.toLocaleString()}표
            <span className="ml-1.5 text-[12px] font-semibold text-[#D88A24]">
              최근 7일 +{r.weeklyVoteDelta}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="shrink-0 text-[#8A7A6A]"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="flex gap-2 border-t border-[#E8D9BF] px-4 py-3">
        <Link
          to={`/restaurants/${r.id}`}
          className="flex flex-1 items-center justify-center rounded-xl border border-[#E8D9BF] py-2.5 text-[13px] font-bold text-[#2A1A12]"
        >
          상세보기
        </Link>
        <RestaurantVoteConfirmButton
          restaurantId={r.id}
          restaurantName={r.name}
          label="투표하기"
          className="flex flex-1 items-center justify-center rounded-xl py-2.5 text-[13px] font-black"
        />
      </div>
    </div>
  )
}

function CrownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="#D88A24" aria-hidden>
      <path d="M2 12h12l1-8-4 3-3-5-3 5-4-3 1 8z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  )
}
