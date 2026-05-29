type VoteButtonProps = {
  restaurantId: number
  disabled?: boolean
}

/** 투표 / 표 이동 — 메인·상세 등에서 공용 */
export function VoteButton({ restaurantId, disabled }: VoteButtonProps) {
  return (
    <button type="button" disabled={disabled} data-restaurant-id={restaurantId}>
      투표하기
    </button>
  )
}
