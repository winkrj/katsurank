import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useRestaurantDetailQuery } from '../../queries/useRestaurantDetailQuery'
import { ClosedRestaurantDetailContent } from './ClosedRestaurantDetailContent'
import { DesktopRestaurantDetailContent } from './DesktopRestaurantDetailContent'
import { MobileRestaurantDetailContent } from './MobileRestaurantDetailContent'

type RestaurantDetailModalProps = {
  restaurantId: number | null
  isMobile: boolean
  onClose: () => void
}

export function RestaurantDetailModal({ restaurantId, isMobile, onClose }: RestaurantDetailModalProps) {
  const { data: restaurant, isPending, isError } = useRestaurantDetailQuery(restaurantId)
  const open = restaurantId != null

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  let content: ReactNode

  if (isPending) {
    content = (
      <div className="flex min-h-[50vh] items-center justify-center text-[#8A7A6A]">불러오는 중…</div>
    )
  } else if (isError || !restaurant) {
    content = (
      <div className="flex min-h-[50vh] items-center justify-center text-[#5F4A3C]">
        가게를 찾을 수 없습니다.
      </div>
    )
  } else if (restaurant.status === 'CLOSED') {
    content = (
      <ClosedRestaurantDetailContent
        restaurant={restaurant}
        layout={isMobile ? 'mobile' : 'desktop'}
        onClose={onClose}
      />
    )
  } else if (isMobile) {
    content = <MobileRestaurantDetailContent restaurant={restaurant} onClose={onClose} />
  } else {
    content = <DesktopRestaurantDetailContent restaurant={restaurant} />
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="닫기"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={
          isMobile
            ? 'relative z-10 h-full w-full overflow-y-auto bg-[#FFFDF4]'
            : 'relative z-10 max-h-[90vh] w-full max-w-[1100px] overflow-y-auto rounded-2xl bg-[#FFFDF4] p-8 shadow-[0_24px_64px_rgba(42,26,18,0.24)]'
        }
      >
        {!isMobile && (
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="absolute right-5 top-5 z-10 flex size-9 items-center justify-center rounded-full bg-black/5 text-[#2A1A12] transition hover:bg-black/10"
          >
            <CloseIcon />
          </button>
        )}
        {content}
      </div>
    </div>,
    document.body,
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M3 3l10 10M13 3L3 13" />
    </svg>
  )
}
