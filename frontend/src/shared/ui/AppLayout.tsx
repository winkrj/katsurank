import { Outlet, useMatch } from 'react-router-dom'
import { useIsMobile } from '../hooks/useIsMobile'
import { HomeHeader } from './header/HomeHeader'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  const isMobile = useIsMobile()
  const isRestaurantDetail = useMatch('/restaurants/:id')
  const hideMobileHeader = isMobile && isRestaurantDetail

  return (
    <>
      {!hideMobileHeader && <HomeHeader />}

      <Outlet />
      {isMobile && <BottomNav />}
    </>
  )
}
