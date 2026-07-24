import { useEffect } from 'react';
import { Outlet, useLocation, useMatch } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuthMeQuery, useCsrfBootstrapQuery } from '../queries/auth';
import { useAuthStore } from '../stores/authStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { HomeHeader } from './header/HomeHeader';
import { BottomNav } from './BottomNav';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AuthInit() {
  const setUser = useAuthStore((s) => s.setUser);
  const { data, error } = useAuthMeQuery();
  useCsrfBootstrapQuery();

  useEffect(() => {
    if (data) {
      setUser({
        id: data.id,
        nickname: data.nickname,
        profileImage: data.profileImage,
      });
    } else if (error instanceof ApiError && error.status === 401) {
      // 비로그인 사용자에게 정상적으로 뜨는 401. 조용히 게스트 상태로 둔다.
      setUser(null);
    }
  }, [data, error, setUser]);

  return null;
}

export function AppLayout() {
  const isMobile = useIsMobile();
  const restaurantDetailMatch = useMatch('/restaurants/:id');
  const isRestaurantDetailPage =
    restaurantDetailMatch != null && restaurantDetailMatch.params.id !== 'new';
  const hideMobileHeader = isMobile && isRestaurantDetailPage;

  return (
    <>
      <AuthInit />
      {isMobile && <ScrollToTop />}
      {!hideMobileHeader && <HomeHeader />}
      <Outlet />
      {isMobile && <BottomNav />}
    </>
  );
}
