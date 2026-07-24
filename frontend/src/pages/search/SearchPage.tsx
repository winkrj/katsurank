import { useIsMobile } from '../../shared/hooks/useIsMobile'
import { DesktopSearchPage } from './components/desktop/DesktopSearchPage'
import { MobileSearchPage } from './components/mobile/MobileSearchPage'

export function SearchPage() {
  const isMobile = useIsMobile()

  return isMobile ? <MobileSearchPage /> : <DesktopSearchPage />
}
