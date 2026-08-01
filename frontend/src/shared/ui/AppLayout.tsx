import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuthMeQuery, useCsrfBootstrapQuery } from '../queries/auth';
import { useAuthStore } from '../stores/authStore';
import { HomeHeader } from './header/HomeHeader';

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
  return (
    <>
      <AuthInit />
      <HomeHeader />
      <Outlet />
    </>
  );
}
