import './style/home.css';
import { useIsMobile } from '../../shared/hooks/useIsMobile';
import { LegalFooter } from '../../shared/ui/LegalFooter';
import { DesktopMain } from './components/desktop/DesktopMain';
import { MobileHero } from './components/mobile/MobileHero';

export function HomePage() {
  const isMobile = useIsMobile(1180);

  return (
    <main className="overflow-x-hidden bg-[#FFFDF4] text-[#2A1A12]">
      {isMobile ? <MobileHero /> : <DesktopMain />}
      <LegalFooter />
    </main>
  );
}
