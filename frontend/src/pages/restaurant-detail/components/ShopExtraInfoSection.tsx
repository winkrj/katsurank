import type { ReactNode } from 'react'
import type { RestaurantDetail } from '../types/restaurantDetail'

type ShopExtraInfoSectionProps = {
  restaurant: RestaurantDetail
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <li className="flex gap-3 text-[14px] leading-snug">
      <span className="mt-0.5 shrink-0 text-[#8A7A6A]">{icon}</span>
      <span>
        <span className="font-semibold text-[#2A1A12]">{label}</span>{' '}
        <span className="text-[#5F4A3C]">{value}</span>
      </span>
    </li>
  )
}

export function ShopExtraInfoSection({ restaurant }: ShopExtraInfoSectionProps) {
  return (
    <section>
      <h2 className="mb-4 text-[16px] font-black text-[#2A1A12]">추가 정보</h2>
      <ul className="space-y-4">
        <InfoRow
          icon={<ClockIcon />}
          label="영업시간:"
          value={`11:00 - 21:30 (브레이크 ${restaurant.breakTime.replace('브레이크타임 ', '')})`}
        />
        <InfoRow icon={<CalendarIcon />} label="휴무일:" value={restaurant.closedDays} />
        <InfoRow icon={<CarIcon />} label="주차:" value={restaurant.parking} />
        <InfoRow icon={<TicketIcon />} label="예약:" value={restaurant.reservation} />
      </ul>
    </section>
  )
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.5 6.5h11M5.5 2v2M10.5 2v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function CarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 10.5 3.8 6.2a1 1 0 0 1 .95-.7h6.5a1 1 0 0 1 .95.7L13.5 10.5M4 10.5h8M3.5 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TicketIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4 3.5h8a1 1 0 0 1 1 1v1.8a1.2 1.2 0 0 0 0 2.4V10.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-1.8a1.2 1.2 0 0 0 0-2.4V4.5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}
