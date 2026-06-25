import { useEffect, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useIsMobile } from '../../hooks/useIsMobile'

type DialogShellProps = {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  footer: ReactNode
}

export function DialogShell({
  open,
  onClose,
  title,
  description,
  icon,
  footer,
}: DialogShellProps) {
  const isMobile = useIsMobile()
  const titleId = useId()
  const descriptionId = useId()

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

  const panelClassName = isMobile
    ? 'w-[calc(100%-2rem)] max-w-[360px] rounded-2xl px-5 py-6'
    : 'w-full max-w-[400px] rounded-3xl px-8 py-8'

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="닫기"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={[
          'relative z-10 border border-[#E8D9BF] bg-white text-center shadow-[0_16px_48px_rgba(42,26,18,0.18)]',
          panelClassName,
        ].join(' ')}
      >
        <div className="mb-6 space-y-3">
          {icon}

          <h2
            id={titleId}
            className={
              isMobile
                ? 'text-[17px] font-black leading-snug text-[#2A1A12]'
                : 'text-[18px] font-black leading-snug text-[#2A1A12]'
            }
          >
            {title}
          </h2>

          {description && (
            <p id={descriptionId} className="text-[14px] leading-relaxed text-[#8A7A6A]">
              {description}
            </p>
          )}
        </div>

        {footer}
      </div>
    </div>,
    document.body,
  )
}
