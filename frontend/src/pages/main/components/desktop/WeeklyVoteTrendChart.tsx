type WeeklyVoteTrendPoint = {
  label: string
  value: number
}

type WeeklyVoteTrendChartProps = {
  data: WeeklyVoteTrendPoint[]
}

export function WeeklyVoteTrendChart({ data }: WeeklyVoteTrendChartProps) {
  const width = 280
  const height = 120
  const padding = { top: 16, right: 8, bottom: 20, left: 8 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const values = data.map((point) => point.value)
  const max = Math.max(...values, 1) * 1.15
  const min = 0

  const coordinates = data.map((point, index) => {
    const x = padding.left + (index / (data.length - 1)) * chartWidth
    const y = padding.top + chartHeight - ((point.value - min) / (max - min)) * chartHeight
    return { x, y, label: point.label, value: point.value }
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
      {coordinates.map(({ x, y, label }) => (
        <circle key={label} cx={x} cy={y} r="3.5" fill="#FFC533" stroke="#C78316" strokeWidth="1.2" />
      ))}
      {last && (
        <text x={last.x} y={last.y - 10} textAnchor="end" className="fill-[#2A1A12] text-[11px] font-black">
          {last.value.toLocaleString()}
        </text>
      )}
      {coordinates.map(({ x, label }, index) => {
        const anchor = index === 0 ? 'start' : index === coordinates.length - 1 ? 'end' : 'middle'
        return (
          <text key={label} x={x} y={height - 4} textAnchor={anchor} className="fill-[#8A7A6A] text-[10px]">
            {label}
          </text>
        )
      })}
    </svg>
  )
}
