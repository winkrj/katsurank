import './style/map.css'
import { useIsMobile } from '../../shared/hooks/useIsMobile'
import { DesktopMainPage } from './components/desktop/DesktopMainPage'
import { MobileMainPage } from './components/mobile/MobileMainPage'
import { useRankingLiveUpdates } from './hooks/useRankingLiveUpdates'

export function MainPage() {
  const isMobile = useIsMobile()
  useRankingLiveUpdates()

  return isMobile ? <MobileMainPage /> : <DesktopMainPage />
}
