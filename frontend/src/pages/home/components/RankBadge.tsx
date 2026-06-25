type RankBadgeProps = {
  rank: number
  className?: string
}

export function RankBadge({ rank, className }: RankBadgeProps) {
  const tone =
    rank === 1
      ? 'border-[#C78316] bg-[#FFC533] text-[#3A2318]'
      : rank <= 3
        ? 'border-[#B97830] bg-[#D99A4E] text-white'
        : 'border-[#D9C6A6] bg-[#FFF7E8] text-[#5F4A3C]'

  return (
    <span
      className={[
        'flex size-[22px] items-center justify-center rounded-[5px] border text-[12px] font-black',
        tone,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {rank}
    </span>
  )
}
