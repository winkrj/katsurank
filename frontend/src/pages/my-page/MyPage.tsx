import { useAuthStore } from '../../shared/stores/authStore'
import { MyPageLoginPrompt } from './components/MyPageLoginPrompt'

export function MyPage() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn())

  if (!isLoggedIn) {
    return <MyPageLoginPrompt />
  }

  return <p className="page__placeholder">현재 1순위 + 표 이동 히스토리 (구현 예정)</p>
}
