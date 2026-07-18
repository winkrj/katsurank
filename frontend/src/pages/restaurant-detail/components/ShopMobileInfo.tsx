import type { RestaurantDetail } from '../types/restaurantDetail'

type ShopMobileInfoProps = {
  restaurant: RestaurantDetail
}

function CrownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden>
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

export function ShopMobileInfo({ restaurant }: ShopMobileInfoProps) {
  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-[22px] font-black leading-tight text-[#2A1A12]">{restaurant.name}</h1>
        {restaurant.rankBadgeLabel && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#E8D9BF] bg-[#FFF4D8] px-2 py-0.5 text-[11px] font-bold text-[#7A431D]">
            <CrownIcon />
            {restaurant.rankBadgeLabel}
          </span>
        )}
      </div>

      <p className="flex items-center gap-1.5 text-[13px] text-[#8A7A6A]">
        <LocationIcon />
        {restaurant.shortAddress}
      </p>

      <p className="text-[14px] text-[#5F4A3C]">{restaurant.tagline}</p>
    </section>
  )
}

function LocationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
      <path
        d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 3.375 4.5 8.5 4.5 8.5s4.5-5.125 4.5-8.5A4.5 4.5 0 0 0 8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="8" cy="6" r="1.5" fill="currentColor" />
    </svg>
  )
}
