import { useState } from 'react'

export function useShareRestaurant() {
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  async function share(id: number, name: string) {
    const url = `${window.location.origin}/?restaurant=${id}`

    if (navigator.share) {
      try {
        await navigator.share({ title: `${name} - 카츠랭`, text: `카츠랭에서 ${name}을(를) 확인해보세요!`, url })
      } catch {
        // 사용자가 공유를 취소한 경우 등 — 무시
      }
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      setToastMessage('링크가 복사되었어요')
    } catch {
      setToastMessage('링크 복사에 실패했어요')
    }
  }

  return { share, toastMessage, dismissToast: () => setToastMessage(null) }
}
