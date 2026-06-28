import { Link } from 'react-router-dom'
import { KAKAO_LOGIN_URL } from '../../constant/api'
import { useAuthStore } from '../../stores/authStore'
import { KakaoLoginButton } from './KakaoLoginButton'

type HomeHeaderAuthProps = {
  variant?: 'desktop' | 'mobile'
}

export function HomeHeaderAuth({ variant = 'desktop' }: HomeHeaderAuthProps) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn())

  if (!isLoggedIn || !user) {
    if (variant === 'mobile') {
      return (
        <a
          href={KAKAO_LOGIN_URL}
          className="inline-flex items-center gap-1 rounded-lg border border-[#E8D9BF] bg-[#FFC533] px-2.5 py-1.5 text-[12px] font-bold text-[#2A1A12]"
        >
          <img src="/images/kakao_icon.png" alt="" className="size-4" aria-hidden />
          로그인
        </a>
      )
    }

    return <KakaoLoginButton />
  }

  if (variant === 'mobile') {
    return (
      <div className="flex items-center gap-2">
        <Link to="/me" className="flex items-center gap-1.5">
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt=""
              className="size-8 rounded-full border border-[#E8D9BF] object-cover"
            />
          ) : (
            <span className="flex size-8 items-center justify-center rounded-full border border-[#E8D9BF] bg-[#FFF4D8] text-[12px] font-black text-[#7A431D]">
              {user.nickname.slice(0, 1)}
            </span>
          )}
          <span className="max-w-[72px] truncate text-[13px] font-bold text-[#2A1A12]">
            {user.nickname}
          </span>
        </Link>
        <button
          type="button"
          onClick={logout}
          className="text-[12px] font-bold text-[#8A7A6A] hover:text-[#2A1A12]"
        >
          로그아웃
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        to="/me"
        className="flex max-w-[180px] items-center gap-2.5 rounded-xl border border-transparent px-2 py-1.5 transition hover:border-[#E8D9BF] hover:bg-[#FFF4D8]"
      >
        {user.profileImage ? (
          <img
            src={user.profileImage}
            alt=""
            className="size-9 shrink-0 rounded-full border border-[#E8D9BF] object-cover"
          />
        ) : (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#E8D9BF] bg-[#FFF4D8] text-[14px] font-black text-[#7A431D]">
            {user.nickname.slice(0, 1)}
          </span>
        )}
        <span className="truncate text-[14px] font-bold text-[#2A1A12]">{user.nickname}</span>
      </Link>

      <button
        type="button"
        onClick={logout}
        className="shrink-0 text-[13px] font-bold text-[#8A7A6A] underline-offset-2 hover:text-[#2A1A12] hover:underline"
      >
        로그아웃
      </button>
    </div>
  )
}
