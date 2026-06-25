import type { RestaurantDetail } from '../types/restaurantDetail'
import { ShopDetailTabs } from './ShopDetailTabs'
import { ShopMobileHero } from './ShopMobileHero'
import { ShopMobileInfo } from './ShopMobileInfo'
import { ShopMobileVoteButton } from './ShopMobileVoteButton'
import { ShopVoteStatsCard } from './ShopVoteStatsCard'

type MobileRestaurantDetailProps = {
  restaurant: RestaurantDetail
}

export function MobileRestaurantDetail({ restaurant }: MobileRestaurantDetailProps) {
  return (
    <main className="bg-[#FFFDF4] pb-[68px] text-[#2A1A12]">
      <ShopMobileHero image={restaurant.images[0]} name={restaurant.name} />

      <div className="space-y-5 px-4 py-5">
        <ShopMobileInfo restaurant={restaurant} />
        <ShopVoteStatsCard restaurant={restaurant} showDots />
        <ShopMobileVoteButton restaurantName={restaurant.name} />

        <hr className="border-[#E8D9BF]" />

        <ShopDetailTabs restaurant={restaurant} layout="mobile" />
      </div>
    </main>
  )
}
