import { useIsMobile } from '../../shared/hooks/useIsMobile'
import { DesktopRankingsPage } from './components/desktop/DesktopRankingsPage'
import { MobileRankingsPage } from './components/mobile/MobileRankingsPage'

export function RankingsPage() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileRankingsPage /> : <DesktopRankingsPage />
}
