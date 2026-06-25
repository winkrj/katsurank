import type { VoteTrendPoint } from '../types/restaurantDetail'

type ShopVoteTrendChartProps = {
  data: VoteTrendPoint[]
  showDots?: boolean
}

export function ShopVoteTrendChart({ data, showDots = false }: ShopVoteTrendChartProps) {
  const width = 280
  const height = 80
  const padding = { top: 10, right: 12, bottom: 22, left: 12 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const values = data.map((point) => point.value)
  const min = Math.min(...values) - 20
  const max = Math.max(...values) + 20

  const coordinates = data.map((point, index) => {
    const x = padding.left + (index / (data.length - 1)) * chartWidth
    const y = padding.top + chartHeight - ((point.value - min) / (max - min)) * chartHeight
    return { x, y, label: point.label }
  })

  const points = coordinates.map(({ x, y }) => `${x},${y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke="#FFC533"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots &&
        coordinates.map(({ x, y, label }) => (
          <circle key={label} cx={x} cy={y} r="3.5" fill="#FFC533" stroke="#C78316" strokeWidth="1" />
        ))}
      {coordinates.map(({ x, label }) => (
        <text
          key={label}
          x={x}
          y={height - 6}
          textAnchor="middle"
          className="fill-[#8A7A6A] text-[9px]"
        >
          {label}
        </text>
      ))}
    </svg>
  )
}
