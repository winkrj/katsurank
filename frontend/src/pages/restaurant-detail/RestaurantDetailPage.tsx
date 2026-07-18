import { useParams } from 'react-router-dom'
import { useIsMobile } from '../../shared/hooks/useIsMobile'
import { ClosedRestaurantDetail } from './components/ClosedRestaurantDetail'
import { DesktopRestaurantDetail } from './components/DesktopRestaurantDetail'
import { MobileRestaurantDetail } from './components/MobileRestaurantDetail'
import { useRestaurantDetailQuery } from './queries/useRestaurantDetailQuery'

export function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const isMobile = useIsMobile()
  const { data: restaurant, isPending, isError } = useRestaurantDetailQuery(id)

  if (isPending) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center bg-[#FFFDF4] pt-14 text-[#8A7A6A]">
        불러오는 중…
      </main>
    )
  }

  if (isError || !restaurant) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center bg-[#FFFDF4] pt-14 text-[#5F4A3C]">
        가게를 찾을 수 없습니다.
      </main>
    )
  }

  if (restaurant.status === 'CLOSED') {
    return <ClosedRestaurantDetail restaurant={restaurant} layout={isMobile ? 'mobile' : 'desktop'} />
  }

  return isMobile ? (
    <MobileRestaurantDetail restaurant={restaurant} />
  ) : (
    <DesktopRestaurantDetail restaurant={restaurant} />
  )
}
