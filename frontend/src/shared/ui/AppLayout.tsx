import { Outlet, useMatch } from 'react-router-dom'
import { useIsMobile } from '../hooks/useIsMobile'
import { HomeHeader } from './header/HomeHeader'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  const isMobile = useIsMobile()
  const restaurantDetailMatch = useMatch('/restaurants/:id')
  const isRestaurantDetailPage =
    restaurantDetailMatch != null && restaurantDetailMatch.params.id !== 'new'
  const hideMobileHeader = isMobile && isRestaurantDetailPage

  return (
    <>
      {!hideMobileHeader && <HomeHeader />}

      <Outlet />
      {isMobile && <BottomNav />}
    </>
  )
}
