import { Link } from 'react-router-dom'
import type { RankingDetailItem } from '../types/rankingDetail'

type RankingTableItemProps = {
  item: RankingDetailItem
  layout: 'desktop' | 'mobile'
}

const DEFAULT_IMAGE = '/images/shop_default_img.png'

export function RankingTableItem({ item, layout }: RankingTableItemProps) {
  const isDesktop = layout === 'desktop'

  if (isDesktop) {
    return (
      <li className="flex items-center gap-5 border-b border-[#F0E3CC] px-6 py-4 last:border-b-0 hover:bg-[#FFFBF0]">
        <div className="flex w-10 shrink-0 justify-center">
          <RankMedal rank={item.rank} />
        </div>

        <div className="h-[90px] w-[120px] shrink-0 overflow-hidden rounded-xl border border-[#E8D9BF] bg-[#E8D9BF]">
          <img src={item.image ?? DEFAULT_IMAGE} alt={item.name} className="size-full object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[18px] font-black text-[#2A1A12]">{item.name}</p>
          {item.address && (
            <p className="mt-0.5 text-[13px] text-[#5F4A3C]">{item.address}</p>
          )}
          {item.hours && (
            <p className="mt-1.5 flex items-center gap-2 text-[13px]">
              {item.isOpen !== undefined && (
                <span className={item.isOpen ? 'font-bold text-[#2A8A4A]' : 'font-bold text-[#8A7A6A]'}>
                  {item.isOpen ? '● 영업 중' : '● 영업 종료'}
                </span>
              )}
              <span className="text-[#5F4A3C]">
                {item.hours}
                {item.breakTime && ` (${item.breakTime})`}
              </span>
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[20px] font-black text-[#2A1A12]">{item.votes.toLocaleString()}표</p>
          {item.weeklyDelta !== undefined && (
            <p className={['mt-0.5 text-[13px] font-bold', item.weeklyDelta >= 0 ? 'text-[#E05050]' : 'text-[#4A90D9]'].join(' ')}>
              지난주 대비 {item.weeklyDelta >= 0 ? '▲' : '▼'} {Math.abs(item.weeklyDelta)}
            </p>
          )}
        </div>

        <Link
          to={`/restaurants/${item.id}`}
          className="shrink-0 rounded-xl border border-[#E8D9BF] px-5 py-2.5 text-[13px] font-bold text-[#2A1A12] transition hover:border-[#D88A24] hover:bg-[#FFF4D8]"
        >
          상세보기
        </Link>
      </li>
    )
  }

  return (
    <li className="border-b border-[#F0E3CC] last:border-b-0">
      <Link
        to={`/restaurants/${item.id}`}
        className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFBF0]"
      >
        <div className="flex w-8 shrink-0 justify-center">
          <RankMedal rank={item.rank} size="sm" />
        </div>

        <div className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-lg border border-[#E8D9BF] bg-[#E8D9BF]">
          <img src={item.image ?? DEFAULT_IMAGE} alt={item.name} className="size-full object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-black text-[#2A1A12]">{item.name}</p>
          {item.address && (
            <p className="truncate text-[12px] text-[#5F4A3C]">{item.address}</p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[14px] font-black text-[#2A1A12]">{item.votes.toLocaleString()}표</p>
          {item.weeklyDelta !== undefined && (
            <p className={['text-[11px] font-bold', item.weeklyDelta >= 0 ? 'text-[#E05050]' : 'text-[#4A90D9]'].join(' ')}>
              {item.weeklyDelta >= 0 ? '▲' : '▼'} {Math.abs(item.weeklyDelta)}
            </p>
          )}
        </div>

        <ChevronIcon />
      </Link>
    </li>
  )
}

function RankMedal({ rank, size = 'md' }: { rank: number; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'size-8 text-[13px]' : 'size-11 text-[15px]'

  if (rank === 1) return (
    <span className={`flex ${dim} items-center justify-center rounded-full border-2 border-[#C78316] bg-[#FFC533] font-black text-[#3A2318]`}>{rank}</span>
  )
  if (rank === 2) return (
    <span className={`flex ${dim} items-center justify-center rounded-full border-2 border-[#9EA8B3] bg-[#C8D4DC] font-black text-white`}>{rank}</span>
  )
  if (rank === 3) return (
    <span className={`flex ${dim} items-center justify-center rounded-full border-2 border-[#B97830] bg-[#D99A4E] font-black text-white`}>{rank}</span>
  )
  return (
    <span className={`flex ${dim} items-center justify-center font-black text-[#5F4A3C]`}>{rank}</span>
  )
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#8A7A6A" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M6 4l4 4-4 4" />
    </svg>
  )
}
