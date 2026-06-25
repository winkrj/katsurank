import { useIsMobile } from '../../hooks/useIsMobile';
import { HomeHeaderDesktop } from './HomeHeaderDesktop';
import { HomeHeaderMobile } from './HomeHeaderMobile';

export function HomeHeader() {
  const isMobile = useIsMobile();

  return isMobile ? <HomeHeaderMobile /> : <HomeHeaderDesktop />;
}
