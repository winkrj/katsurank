import { RestaurantVoteConfirmButton } from './RestaurantVoteConfirmButton'

type ShopMobileVoteButtonProps = {
  restaurantId: number
  restaurantName: string
}

export function ShopMobileVoteButton({ restaurantId, restaurantName }: ShopMobileVoteButtonProps) {
  return (
    <RestaurantVoteConfirmButton
      restaurantId={restaurantId}
      restaurantName={restaurantName}
      className="w-full rounded-xl"
    />
  )
}
