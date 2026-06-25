import { Button } from '../../../shared/ui/Button'
import type { RestaurantDetail } from '../types/restaurantDetail'
import { RestaurantVoteConfirmButton } from './RestaurantVoteConfirmButton'
import { ShopVoteStatsCard } from './ShopVoteStatsCard'

type ShopVotePanelProps = {
  restaurant: RestaurantDetail
}

export function ShopVotePanel({ restaurant }: ShopVotePanelProps) {
  return (
    <ShopVoteStatsCard restaurant={restaurant}>
      <div className="mt-5 space-y-3">
        <RestaurantVoteConfirmButton
          restaurantName={restaurant.name}
          className="w-full rounded-xl"
        />
        <Button variant="secondary" className="w-full rounded-xl">
          내 표 지정하기
        </Button>
      </div>
    </ShopVoteStatsCard>
  )
}
