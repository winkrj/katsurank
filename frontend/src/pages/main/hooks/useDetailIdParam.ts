import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

function parseId(raw: string | null): number | null {
  const parsed = raw ? Number(raw) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

// 상세보기 상태를 ?restaurant=<id> 쿼리로 동기화한다 — 공유 링크로 들어왔을 때 그대로 복원하기 위함.
export function useDetailIdParam() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [detailId, setDetailIdState] = useState<number | null>(() =>
    parseId(searchParams.get('restaurant')),
  )

  const openDetail = useCallback(
    (id: number) => {
      setDetailIdState(id)
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('restaurant', String(id))
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const closeDetail = useCallback(() => {
    setDetailIdState(null)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('restaurant')
        return next
      },
      { replace: true },
    )
  }, [setSearchParams])

  return { detailId, openDetail, closeDetail }
}
