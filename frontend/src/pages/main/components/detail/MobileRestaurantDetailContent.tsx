import { Toast } from '../../../../shared/ui/Toast'
import { useShareRestaurant } from '../../hooks/useShareRestaurant'
import type { RestaurantDetail } from '../../types/restaurantDetail'
import { RestaurantVoteConfirmButton } from './RestaurantVoteConfirmButton'
import { ShopDetailTabs } from './ShopDetailTabs'
import { ShopMobileHero } from './mobile/ShopMobileHero'
import { ShopMobileInfo } from './mobile/ShopMobileInfo'
import { ShopVoteStatsCard } from './ShopVoteStatsCard'

type MobileRestaurantDetailContentProps = {
  restaurant: RestaurantDetail
  onClose: () => void
}

export function MobileRestaurantDetailContent({ restaurant, onClose }: MobileRestaurantDetailContentProps) {
  const { share, toastMessage, dismissToast } = useShareRestaurant()

  return (
    <div className="bg-[#FFFDF4] text-[#2A1A12]">
      <ShopMobileHero
        images={restaurant.images}
        name={restaurant.name}
        onClose={onClose}
        onShare={() => share(restaurant.id, restaurant.name)}
      />

      <div className="space-y-5 px-4 py-5">
        <ShopMobileInfo restaurant={restaurant} />
        <ShopVoteStatsCard restaurant={restaurant} />

        <a
          href={restaurant.kakaoMapUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#E8D9BF] bg-white text-[13px] font-bold text-[#2A1A12] transition hover:border-[#D88A24] hover:bg-[#FFF4D8]"
        >
          <MapIcon />
          카카오맵으로 보기
        </a>

        <RestaurantVoteConfirmButton
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          className="w-full rounded-xl"
        />

        <hr className="border-[#E8D9BF]" />

        <ShopDetailTabs layout="mobile" />
      </div>

      <Toast message={toastMessage} onDismiss={dismissToast} />
    </div>
  )
}

function MapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M1 3.5l5-2 6 2 5-2V14.5l-5 2-6-2-5 2V3.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6 1.5v13M12 3.5v13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
