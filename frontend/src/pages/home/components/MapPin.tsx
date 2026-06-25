type MapPinProps = {
  rank: number
  className: string
}

export function MapPin({ rank, className }: MapPinProps) {
  return (
    <button
      type="button"
      aria-label={`${rank}위 돈까스집`}
      className={`katsu-map-pin ${className}`}
    >
      <span className="katsu-map-pin__rank">{rank}</span>
      <span className="katsu-map-pin__icon">
        <img src="/images/katsu_icon.png" alt="" className="size-full" aria-hidden />
      </span>
    </button>
  )
}
