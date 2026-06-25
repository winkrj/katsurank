import { RestaurantVoteConfirmButton } from './RestaurantVoteConfirmButton'

type ShopMobileVoteButtonProps = {
  restaurantName: string
}

export function ShopMobileVoteButton({ restaurantName }: ShopMobileVoteButtonProps) {
  return (
    <RestaurantVoteConfirmButton
      restaurantName={restaurantName}
      className="w-full rounded-xl"
    />
  )
}
