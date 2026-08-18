import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { API_BASE_URL } from '../../../shared/constant/api'
import type { RankingItem } from '../../../shared/types/ranking'
import type { Paginated } from '../../../shared/types/common'

const RANKING_STREAM_URL = `${API_BASE_URL}/api/v1/ranking/stream`

const THROTTLE_MS = 3000

type RankingSnapshotEvent = {
  version: number
  changedAt: string
  generatedAt: string
  items: RankingItem[]
}

/**
 * 랭킹 SSE 스트림(ranking-snapshot 이벤트)을 구독해 랭킹 쿼리 캐시를 직접 갱신한다.
 * 이벤트마다 전체 랭킹 스냅샷이 오므로 재요청 없이 캐시를 바로 patch한다.
 * 신호가 연달아 와도 3초에 한 번만 반영하도록 스로틀한다
 * (leading: 3초 넘게 조용했다 첫 신호면 즉시, trailing: 그 후 몰린 신호는 가장 최신 걸로 한 번만).
 */
export function useRankingLiveUpdates() {
  const queryClient = useQueryClient()
  const lastAppliedAtRef = useRef(0)
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestSnapshotRef = useRef<RankingSnapshotEvent | null>(null)

  useEffect(() => {
    function applySnapshot(snapshot: RankingSnapshotEvent) {
      lastAppliedAtRef.current = Date.now()
      queryClient.setQueriesData<Paginated<RankingItem>>({ queryKey: ['ranking', 'list'] }, (old) =>
        old ? { ...old, items: snapshot.items.slice(0, old.limit) } : old,
      )
    }

    function handleSnapshot(event: MessageEvent<string>) {
      let snapshot: RankingSnapshotEvent
      try {
        snapshot = JSON.parse(event.data)
      } catch {
        return
      }
      latestSnapshotRef.current = snapshot

      const elapsed = Date.now() - lastAppliedAtRef.current
      if (elapsed >= THROTTLE_MS) {
        applySnapshot(snapshot)
        return
      }

      if (pendingTimeoutRef.current) return // 이미 트레일링 갱신이 예약돼 있으면 추가로 예약하지 않는다.

      pendingTimeoutRef.current = setTimeout(() => {
        pendingTimeoutRef.current = null
        if (latestSnapshotRef.current) applySnapshot(latestSnapshotRef.current)
      }, THROTTLE_MS - elapsed)
    }

    const eventSource = new EventSource(RANKING_STREAM_URL, { withCredentials: true })
    eventSource.addEventListener('ranking-snapshot', handleSnapshot)
    eventSource.onerror = () => {
      // EventSource는 연결이 끊기면 브라우저가 자동으로 재연결을 시도한다 — 별도 처리 불필요.
    }

    return () => {
      eventSource.close()
      if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current)
    }
  }, [queryClient])
}
