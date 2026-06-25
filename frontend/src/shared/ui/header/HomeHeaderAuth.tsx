import { useAuthStore } from '../../stores/authStore';
import { KakaoLoginButton } from './KakaoLoginButton';

export function HomeHeaderAuth() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn());
  const nickname = useAuthStore((s) => s.user?.nickname);

  if (isLoggedIn) {
    return <span className="text-[13px] font-bold">{nickname}</span>;
  }

  return <KakaoLoginButton />;
}
