import { useEffect } from 'react'
import { Outlet, useMatch } from 'react-router-dom'
import { useAuthMeQuery } from '../queries/auth'
import { useAuthStore } from '../stores/authStore'
import { useIsMobile } from '../hooks/useIsMobile'
import { HomeHeader } from './header/HomeHeader'
import { BottomNav } from './BottomNav'

function AuthInit() {
  const { data } = useAuthMeQuery()
  const setUser = useAuthStore((s) => s.setUser)

  useEffect(() => {
    if (data) {
      setUser({
        id: data.id,
        nickname: data.nickname,
        profileImage: data.profileImageUrl,
      })
    } else {
      setUser(null)
    }
  }, [data, setUser])

  return null
}

export function AppLayout() {
  const isMobile = useIsMobile()
  const restaurantDetailMatch = useMatch('/restaurants/:id')
  const isRestaurantDetailPage =
    restaurantDetailMatch != null && restaurantDetailMatch.params.id !== 'new'
  const hideMobileHeader = isMobile && isRestaurantDetailPage

  return (
    <>
      <AuthInit />
      {!hideMobileHeader && <HomeHeader />}
      <Outlet />
      {isMobile && <BottomNav />}
    </>
  )
}
