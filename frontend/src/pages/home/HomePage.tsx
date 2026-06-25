import './style/home.css';
import { useIsMobile } from '../../shared/hooks/useIsMobile';
import { DesktopMain } from './components/DesktopMain';
import { MobileHero } from './components/MobileHero';

export function HomePage() {
  const isMobile = useIsMobile();

  return (
    <main className="overflow-x-hidden bg-[#FFFDF4] text-[#2A1A12]">
      {isMobile ? <MobileHero /> : <DesktopMain />}
    </main>
  );
}
