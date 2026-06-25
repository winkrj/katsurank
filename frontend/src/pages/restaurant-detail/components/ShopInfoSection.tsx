import type { ReactNode } from 'react'
import type { RestaurantDetail } from '../types/restaurantDetail'

type ShopInfoSectionProps = {
  restaurant: RestaurantDetail
}

function CrownIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M2 13.5 4.2 6.8l2.8 2.4L9 4.5l2 4.7 2.8-2.4L16 13.5H2Z"
        fill="#FFC533"
        stroke="#C78316"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function InfoRow({
  icon,
  children,
}: {
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <li className="flex gap-3 text-[14px] leading-snug text-[#5F4A3C]">
      <span className="mt-0.5 shrink-0 text-[#8A7A6A]">{icon}</span>
      <span>{children}</span>
    </li>
  )
}

export function ShopInfoSection({ restaurant }: ShopInfoSectionProps) {
  return (
    <section className="flex flex-col justify-center space-y-5 px-2">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <CrownIcon />
          <h1 className="font-serif text-[2rem] font-black leading-tight text-[#2A1A12]">
            {restaurant.name}
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#E8D9BF] bg-[#FFF4D8] px-2.5 py-1 text-[12px] font-bold text-[#7A431D]">
            <CrownIcon />
            {restaurant.rankAreaLabel}
          </span>
        </div>
        <p className="text-[14px] text-[#8A7A6A]">{restaurant.tagline}</p>
      </div>

      <ul className="space-y-3">
        <InfoRow icon={<LocationIcon />}>
          {restaurant.address}
          <br />
          <span className="text-[13px] text-[#8A7A6A]">{restaurant.distance}</span>
        </InfoRow>
        <InfoRow icon={<ClockIcon />}>
          <span className="font-semibold text-[#2A1A12]">{restaurant.hours}</span>
          <br />
          <span className="text-[13px] text-[#8A7A6A]">{restaurant.breakTime}</span>
        </InfoRow>
        <InfoRow icon={<PhoneIcon />}>{restaurant.phone}</InfoRow>
      </ul>

      <a
        href={restaurant.kakaoMapUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-11 w-full max-w-sm items-center justify-center gap-2 rounded-lg border border-[#E8D9BF] bg-white text-[14px] font-bold text-[#2A1A12] transition hover:border-[#D88A24] hover:bg-[#FFF4D8]"
      >
        <img src="/images/kakao_icon.png" alt="" className="size-5" aria-hidden />
        카카오맵으로 보기
      </a>
    </section>
  )
}

function LocationIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 3.375 4.5 8.5 4.5 8.5s4.5-5.125 4.5-8.5A4.5 4.5 0 0 0 8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="8" cy="6" r="1.5" fill="currentColor" />
    </svg>
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

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4.5 2.5h2l1 3-1.6 1.1a7.2 7.2 0 0 0 3.5 3.5L10.5 8l3 1v2a1.5 1.5 0 0 1-1.5 1.5C6.2 12.5 3.5 9.8 3.5 6A1.5 1.5 0 0 1 4.5 2.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}
