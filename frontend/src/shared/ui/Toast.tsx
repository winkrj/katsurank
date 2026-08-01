import { useEffect } from 'react'
import { createPortal } from 'react-dom'

type ToastProps = {
  message: string | null
  onDismiss: () => void
}

export function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDismiss, 2000)
    return () => clearTimeout(timer)
  }, [message, onDismiss])

  if (!message) return null

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-[300] flex justify-center px-4">
      <div className="rounded-full bg-[#2A1A12] px-4 py-2.5 text-[13px] font-bold text-white shadow-lg">
        {message}
      </div>
    </div>,
    document.body,
  )
}
