type RestaurantClosedStatusProps = {
  layout?: 'desktop' | 'mobile'
}

export function RestaurantClosedBadge({ layout = 'desktop' }: RestaurantClosedStatusProps) {
  const isMobile = layout === 'mobile'

  return (
    <span
      className={[
        'inline-flex shrink-0 items-center gap-1 rounded-full border border-[#3A2318] bg-[#2A1A12] font-black text-white',
        isMobile ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[12px]',
      ].join(' ')}
    >
      <ClosedIcon />
      폐업
    </span>
  )
}

export function RestaurantClosedNotice({ layout = 'desktop' }: RestaurantClosedStatusProps) {
  const isMobile = layout === 'mobile'

  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl border border-[#E8D9BF] bg-[#F8F0DC] text-center',
        isMobile ? 'px-4 py-6' : 'max-w-[480px] px-8 py-8',
      ].join(' ')}
    >
      <SparkleIcon className="absolute left-5 top-6 size-3 opacity-70" />
      <SparkleIcon className="absolute right-6 top-10 size-2.5 opacity-50" />
      <SparkleIcon className="absolute bottom-7 left-8 size-2.5 opacity-60" />
      <SparkleIcon className="absolute bottom-9 right-5 size-3 opacity-70" />

      <img
        src="/images/close_person_icon.png"
        alt="폐업 안내 캐릭터"
        className={isMobile ? 'mx-auto h-24 w-auto' : 'mx-auto h-28 w-auto'}
      />

      <p
        className={
          isMobile
            ? 'mt-3 text-[15px] font-black text-[#2A1A12]'
            : 'mt-4 text-[16px] font-black text-[#2A1A12]'
        }
      >
        현재 폐업한 가게입니다.
      </p>
      <p
        className={
          isMobile
            ? 'mt-1 text-[12px] leading-relaxed text-[#6B5A48]'
            : 'mt-1.5 text-[13px] leading-relaxed text-[#6B5A48]'
        }
      >
        더 이상 운영하지 않아
        <br />
        랭킹과 투표 대상에서 제외된 상태예요.
      </p>
    </div>
  )
}

function ClosedIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.2 8.8 8.8 3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
      <path d="M8 0c.3 3.2 1 4.7 4 5-3 .3-3.7 1.8-4 5-.3-3.2-1-4.7-4-5 3-.3 3.7-1.8 4-5Z" fill="#FFC533" />
    </svg>
  )
}
