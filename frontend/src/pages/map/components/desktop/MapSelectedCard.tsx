import { Link } from 'react-router-dom'
import { RestaurantVoteConfirmButton } from '../../../restaurant-detail/components/RestaurantVoteConfirmButton'
import type { MapRestaurant } from '../../types/map'

type MapSelectedCardProps = {
  restaurant: MapRestaurant
  onClose: () => void
}

export function MapSelectedCard({ restaurant: r, onClose }: MapSelectedCardProps) {
  return (
    <div className="absolute bottom-4 left-1/2 z-20 w-[calc(100%-2rem)] max-w-[740px] -translate-x-1/2 overflow-hidden rounded-2xl border border-[#E8D9BF] bg-white shadow-[0_8px_32px_rgba(42,26,18,0.16)]">
      <div className="flex items-center gap-4 p-4">
        {/* 이미지 */}
        <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border border-[#E8D9BF] bg-[#E8D9BF]">
          <img src={r.image} alt={r.name} className="size-full object-cover" />
        </div>

        {/* 정보 */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {r.rank === 1 && (
            <span className="flex shrink-0 items-center gap-1 text-[13px] font-black text-[#D88A24]">
              <CrownIcon />
            </span>
          )}
          <h3 className="truncate text-[17px] font-black text-[#2A1A12]">{r.name}</h3>
          {r.rank <= 3 && (
            <span className="shrink-0 rounded-full bg-[#FFF4D8] px-2 py-0.5 text-[11px] font-bold text-[#D88A24]">
              현재 {r.rank}위
            </span>
          )}
        </div>

        {/* 투표수 */}
        <div className="flex shrink-0 flex-col items-end gap-0.5 pr-8">
          <p className="text-[22px] font-black text-[#2A1A12]">{r.votes.toLocaleString()}표</p>
          <p className="text-[12px] text-[#8A7A6A]">전체 득표 수</p>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex border-t border-[#E8D9BF]">
        <Link
          to={`/restaurants/${r.id}`}
          className="flex flex-1 items-center justify-center py-3 text-[14px] font-bold text-[#2A1A12] transition hover:bg-[#FFF4D8]"
        >
          상세보기
        </Link>
        <div className="w-px bg-[#E8D9BF]" />
        <a
          href={`https://map.kakao.com/link/to/${r.name},${r.lat},${r.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center py-3 text-[14px] font-bold text-[#2A1A12] transition hover:bg-[#FFF4D8]"
        >
          길찾기
        </a>
        <div className="w-px bg-[#E8D9BF]" />
        <RestaurantVoteConfirmButton
          restaurantId={r.id}
          restaurantName={r.name}
          className="flex flex-1 items-center justify-center rounded-none bg-[#FFC533] py-3 text-[14px] font-black text-[#2A1A12] transition hover:bg-[#D88A24]"
        />
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-black/10 text-[#2A1A12] transition hover:bg-black/20"
      >
        <CloseIcon />
      </button>
    </div>
  )
}

function CrownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M2 12h12l1-8-4 3-3-5-3 5-4-3 1 8z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M2 2l10 10M12 2L2 12" />
    </svg>
  )
}
