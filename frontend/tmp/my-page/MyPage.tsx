import { useIsMobile } from '../../shared/hooks/useIsMobile'
import { useAuthStore } from '../../shared/stores/authStore'
import { DesktopMyPage } from './components/desktop/DesktopMyPage'
import { MobileMyPage } from './components/mobile/MobileMyPage'
import { MyPageLoginPrompt } from './components/MyPageLoginPrompt'

export function MyPage() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn())
  const isMobile = useIsMobile()

  if (!isLoggedIn) return <MyPageLoginPrompt />

  return isMobile ? <MobileMyPage /> : <DesktopMyPage />
}
