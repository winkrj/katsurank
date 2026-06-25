import { NavLink } from 'react-router-dom'
import { KAKAO_LOGIN_URL } from '../constant/api'
import { useAuthStore } from '../stores/authStore'

const NAV_TABS = [
  { to: '/', label: '랭킹', end: true, icon: IconRanking },
  { to: '/map', label: '지도', end: false, icon: IconMap },
  { to: '/search', label: '검색', end: false, icon: IconSearch },
  { to: '/me', label: '내표', end: false, icon: IconMyVote },
] as const

const tabClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-bold leading-none no-underline transition-colors',
    isActive ? 'text-[#2A1A12]' : 'text-[#8A7A6A]',
  ].join(' ')

export function BottomNav() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn())

  return (
    <>
      <div className="h-[calc(68px+env(safe-area-inset-bottom,0px))]" aria-hidden />

      <nav
        aria-label="하단 네비게이션"
        className="fixed bottom-0 left-0 z-[100] box-content flex h-[68px] w-full items-stretch border-t border-[#E8D9BF] bg-[#FFFDF4] pb-[env(safe-area-inset-bottom,0px)]"
      >
        {NAV_TABS.map(({ to, label, end, icon: Icon }) => (
          <NavLink key={to} to={to} end={end} className={tabClass}>
            {({ isActive }) => (
              <>
                <Icon active={isActive} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {isLoggedIn ? (
          <NavLink to="/me" className={tabClass}>
            {({ isActive }) => (
              <>
                <IconLogin active={isActive} />
                <span>로그인</span>
              </>
            )}
          </NavLink>
        ) : (
          <a href={KAKAO_LOGIN_URL} className={tabClass({ isActive: false })}>
            <IconLogin active={false} />
            <span>로그인</span>
          </a>
        )}
      </nav>
    </>
  )
}

type IconProps = {
  active?: boolean
}

function IconRanking({ active }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden
      className={active ? 'text-[#2A1A12]' : 'text-[#8A7A6A]'}
    >
      <path
        fill="currentColor"
        d="M12 2l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 7.2l5-.7L12 2z"
      />
      <path fill="currentColor" d="M7 14h10v2H7z" opacity="0.85" />
    </svg>
  )
}

function IconMap({ active }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
      className={active ? 'text-[#2A1A12]' : 'text-[#8A7A6A]'}
    >
      <path d="M4 6l6-3 6 3 4-2v13l-4 2-6-3-6 3-4-2V4z" />
      <path d="M10 3v13M14 6v13" />
    </svg>
  )
}

function IconSearch({ active }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
      className={active ? 'text-[#2A1A12]' : 'text-[#8A7A6A]'}
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" strokeLinecap="round" />
    </svg>
  )
}

function IconMyVote({ active }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
      className={active ? 'text-[#2A1A12]' : 'text-[#8A7A6A]'}
    >
      <path d="M7 4h10l1 4H6l1-4z" />
      <path d="M8 8v8l4 2 4-2V8" />
      <path d="M12 10v6" />
    </svg>
  )
}

function IconLogin({ active }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
      className={active ? 'text-[#2A1A12]' : 'text-[#8A7A6A]'}
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M6 20c.8-3 2.8-4.5 6-4.5s5.2 1.5 6 4.5" strokeLinecap="round" />
    </svg>
  )
}
