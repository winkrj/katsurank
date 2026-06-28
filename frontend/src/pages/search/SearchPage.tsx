import { useIsMobile } from '../../shared/hooks/useIsMobile'
import { DesktopSearchPage } from './components/DesktopSearchPage'
import { MobileSearchPage } from './components/MobileSearchPage'

export function SearchPage() {
  const isMobile = useIsMobile()

  return isMobile ? <MobileSearchPage /> : <DesktopSearchPage />
}
