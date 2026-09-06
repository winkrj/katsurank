import type { RankingHistoryItem } from '../../../../shared/types/ranking'

type RankTrendChartProps = {
  data: RankingHistoryItem[]
}

export function RankTrendChart({ data }: RankTrendChartProps) {
  const width = 280
  const height = 120
  const padding = { top: 16, right: 8, bottom: 20, left: 8 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const ranks = data.map((point) => point.rank)
  const maxRank = Math.max(...ranks, 1)
  const rankSpan = maxRank - 1 // 순위는 항상 1위가 최선 — span이 0이면(전부 1위) 전부 맨 위에 찍는다

  // 순위는 낮을수록 좋으므로 y좌표를 반전한다: 1위가 그래프 맨 위에 오도록.
  const coordinates = data.map((point, index) => {
    const x =
      data.length === 1
        ? padding.left + chartWidth / 2
        : padding.left + (index / (data.length - 1)) * chartWidth
    const y = padding.top + (rankSpan === 0 ? 0 : ((point.rank - 1) / rankSpan) * chartHeight)
    return { x, y, date: point.date, rank: point.rank, voteCount: point.voteCount }
  })

  const linePoints = coordinates.map(({ x, y }) => `${x},${y}`).join(' ')
  const areaPoints = `${padding.left},${padding.top + chartHeight} ${linePoints} ${
    padding.left + chartWidth
  },${padding.top + chartHeight}`

  const last = coordinates[coordinates.length - 1]

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" aria-hidden>
      <polygon points={areaPoints} fill="#FFC533" fillOpacity="0.15" />
      <polyline
        points={linePoints}
        fill="none"
        stroke="#D88A24"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coordinates.map(({ x, y, date }) => (
        <circle key={date} cx={x} cy={y} r="3.5" fill="#FFC533" stroke="#C78316" strokeWidth="1.2" />
      ))}
      {last && (
        <text x={last.x} y={last.y - 10} textAnchor="end" className="fill-[#2A1A12] text-[11px] font-black">
          {last.rank}위 · {last.voteCount.toLocaleString()}표
        </text>
      )}
      {coordinates.map(({ x, date }, index) => {
        const anchor = index === 0 ? 'start' : index === coordinates.length - 1 ? 'end' : 'middle'
        return (
          <text key={date} x={x} y={height - 4} textAnchor={anchor} className="fill-[#8A7A6A] text-[10px]">
            {formatMonthDay(date)}
          </text>
        )
      })}
    </svg>
  )
}

function formatMonthDay(dateStr: string): string {
  const [, month, day] = dateStr.split('-')
  return `${Number(month)}/${Number(day)}`
}
