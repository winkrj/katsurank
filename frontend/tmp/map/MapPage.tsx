import { useIsMobile } from '../../shared/hooks/useIsMobile'
import './style/map.css'
import { DesktopMapPage } from './components/desktop/DesktopMapPage'
import { MobileMapPage } from './components/mobile/MobileMapPage'

export function MapPage() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileMapPage /> : <DesktopMapPage />
}
