import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { API_BASE_URL } from '../../../shared/constant/api'
import { queryKeys } from '../../../shared/queries/queryKeys'

// TODO: 백엔드 SSE 엔드포인트 경로 확정되면 교체
const RANKING_STREAM_URL = `${API_BASE_URL}/api/v1/ranking/stream`

const THROTTLE_MS = 3000

/**
 * 투표 발생 SSE 신호를 받아 랭킹 쿼리를 무효화한다.
 * 신호가 연달아 와도 3초에 한 번만 재조회하도록 스로틀한다
 * (leading: 3초 넘게 조용했다 첫 신호면 즉시, trailing: 그 후 몰린 신호는 남은 시간 뒤 한 번만).
 */
export function useRankingLiveUpdates() {
  const queryClient = useQueryClient()
  const lastInvalidatedAtRef = useRef(0)
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function invalidateRanking() {
      lastInvalidatedAtRef.current = Date.now()
      queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all })
    }

    function handleVoteChanged() {
      const elapsed = Date.now() - lastInvalidatedAtRef.current

      if (elapsed >= THROTTLE_MS) {
        invalidateRanking()
        return
      }

      if (pendingTimeoutRef.current) return // 이미 트레일링 갱신이 예약돼 있으면 추가로 예약하지 않는다.

      pendingTimeoutRef.current = setTimeout(() => {
        pendingTimeoutRef.current = null
        invalidateRanking()
      }, THROTTLE_MS - elapsed)
    }

    const eventSource = new EventSource(RANKING_STREAM_URL, { withCredentials: true })
    eventSource.addEventListener('vote-changed', handleVoteChanged)
    // 서버가 event 이름 없이 기본 메시지로 보낼 수도 있으니 폴백으로 같이 받는다.
    eventSource.onmessage = handleVoteChanged
    eventSource.onerror = () => {
      // EventSource는 연결이 끊기면 브라우저가 자동으로 재연결을 시도한다 — 별도 처리 불필요.
    }

    return () => {
      eventSource.close()
      if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current)
    }
  }, [queryClient])
}
