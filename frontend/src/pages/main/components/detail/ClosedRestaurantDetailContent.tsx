import type { ReactNode } from 'react'
import { Toast } from '../../../../shared/ui/Toast'
import { useShareRestaurant } from '../../hooks/useShareRestaurant'
import type { RestaurantDetail } from '../../types/restaurantDetail'
import { RestaurantClosedBadge, RestaurantClosedNotice } from './RestaurantClosedStatus'
import { ShopImageGallery } from './desktop/ShopImageGallery'
import { ShopMobileHero } from './mobile/ShopMobileHero'

type ClosedRestaurantDetailContentProps = {
  restaurant: RestaurantDetail
  layout: 'desktop' | 'mobile'
  onClose: () => void
}

export function ClosedRestaurantDetailContent({ restaurant, layout, onClose }: ClosedRestaurantDetailContentProps) {
  const { share, toastMessage, dismissToast } = useShareRestaurant()

  if (layout === 'mobile') {
    return (
      <div className="bg-[#FFFDF4] text-[#2A1A12]">
        <ShopMobileHero
          images={restaurant.images}
          name={restaurant.name}
          onClose={onClose}
          onShare={() => share(restaurant.id, restaurant.name)}
        />

        <section className="space-y-5 px-4 py-5">
          <ClosedSummary restaurant={restaurant} layout="mobile" />
          <RestaurantClosedNotice layout="mobile" />
          <ClosedMetrics restaurant={restaurant} layout="mobile" />
          <ClosedActions onClose={onClose} layout="mobile" />
          <ClosedReportLink />
        </section>

        <Toast message={toastMessage} onDismiss={dismissToast} />
      </div>
    )
  }

  return (
    <div className="bg-[#FFFDF4] text-[#2A1A12]">
      <div className="grid grid-cols-[minmax(280px,380px)_minmax(0,1fr)] gap-8">
        <ShopImageGallery images={restaurant.images} name={restaurant.name} />

        <section className="flex flex-col justify-center space-y-5">
          <ClosedSummary restaurant={restaurant} layout="desktop" />
          <RestaurantClosedNotice layout="desktop" />
          <ClosedMetrics restaurant={restaurant} layout="desktop" />
          <ClosedActions onClose={onClose} layout="desktop" />
        </section>
      </div>

      <div className="mt-6">
        <ClosedReportLink />
      </div>
    </div>
  )
}

function ClosedSummary({
  restaurant,
  layout,
}: {
  restaurant: RestaurantDetail
  layout: 'desktop' | 'mobile'
}) {
  const isMobile = layout === 'mobile'

  return (
    <div className="space-y-2">
      <RestaurantClosedBadge layout={layout} />
      <h1
        className={
          isMobile
            ? 'flex items-center gap-1.5 text-[26px] font-black leading-tight'
            : 'flex items-center gap-2 font-serif text-[2.5rem] font-black leading-tight'
        }
      >
        <CrownIcon size={isMobile ? 20 : 28} />
        {restaurant.name}
      </h1>
      <p className={isMobile ? 'text-[14px] text-[#5F4A3C]' : 'max-w-[480px] text-[15px] text-[#5F4A3C]'}>
        이 가게는 현재 폐업한 가게예요. 랭킹과 투표 대상에서 제외됐습니다.
      </p>
    </div>
  )
}

function ClosedMetrics({
  restaurant,
  layout,
}: {
  restaurant: RestaurantDetail
  layout: 'desktop' | 'mobile'
}) {
  const isMobile = layout === 'mobile'

  return (
    <div className={isMobile ? 'grid grid-cols-2 gap-2' : 'grid max-w-[480px] grid-cols-2 gap-3'}>
      <ClosedMetric
        label="이전 누적 투표"
        value={`${restaurant.totalVotes.toLocaleString()}표`}
        icon={<BallotBoxIcon />}
      />
      <ClosedMetric label="현재 상태" value="폐업" icon={<HangingSignIcon />} />
    </div>
  )
}

function ClosedMetric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-[#C9BCA4] bg-[#F4EFE6] px-4 py-3">
      <div>
        <p className="text-[12px] font-bold text-[#6B5A48]">{label}</p>
        <p className="mt-1 text-[18px] font-black text-[#2A1A12]">{value}</p>
      </div>
      <span className="shrink-0 text-[#C78316]">{icon}</span>
    </div>
  )
}

function ClosedActions({ onClose, layout }: { onClose: () => void; layout: 'desktop' | 'mobile' }) {
  const isMobile = layout === 'mobile'

  return (
    <button
      type="button"
      onClick={onClose}
      className={[
        'flex h-12 items-center justify-center gap-1.5 rounded-lg border-2 border-[#DBBA24] bg-[#FFC533] text-[14px] font-black text-[#2A1A12] transition hover:bg-[#D88A24]',
        isMobile ? 'w-full' : 'max-w-[480px]',
      ].join(' ')}
    >
      <PinIcon />
      다른 가게 찾기
    </button>
  )
}

function ClosedReportLink() {
  // TODO: 제보 폼 연결 전까지 비활성 링크
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between rounded-xl border border-[#E8D9BF] bg-[#FBF6E9] px-4 py-3.5 text-left text-[13px] font-bold text-[#5F4A3C] transition hover:bg-[#FFF4D8]"
    >
      <span className="flex items-center gap-2">
        <InfoIcon />
        정보가 잘못되었나요? 제보하기
      </span>
      <ChevronRightIcon />
    </button>
  )
}

function CrownIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden className="shrink-0">
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

function BallotBoxIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <path
        d="M10 14V9a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v5"
        fill="#FFF4D8"
        stroke="#C78316"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M14 5.3l.9 1.8 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3.9-1.8Z"
        fill="#FFC533"
        stroke="#C78316"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <rect x="4" y="14" width="20" height="10" rx="1.5" fill="#FFF4D8" stroke="#C78316" strokeWidth="1.6" />
      <path d="M4 18h20" stroke="#C78316" strokeWidth="1.6" />
    </svg>
  )
}

function HangingSignIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <circle cx="14" cy="5.5" r="1.4" fill="#C78316" />
      <path d="M12.8 6.6 8 11.5M15.2 6.6 20 11.5" stroke="#C78316" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="6" y="11.5" width="16" height="10" rx="1.5" fill="#FFF4D8" stroke="#C78316" strokeWidth="1.6" />
      <path d="M9 16.5h10" stroke="#C78316" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 3.375 4.5 8.5 4.5 8.5s4.5-5.125 4.5-8.5A4.5 4.5 0 0 0 8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="8" cy="6" r="1.5" fill="currentColor" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="5.3" r="0.9" fill="currentColor" />
      <path d="M8 7.6v3.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M5 3.5 9.5 7 5 10.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
