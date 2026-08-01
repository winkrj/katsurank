import './style/map.css'
import { useIsMobile } from '../../shared/hooks/useIsMobile'
import { DesktopMainPage } from './components/desktop/DesktopMainPage'
import { MobileMainPage } from './components/mobile/MobileMainPage'

export function MainPage() {
  const isMobile = useIsMobile()

  return isMobile ? <MobileMainPage /> : <DesktopMainPage />
}
