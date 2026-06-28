import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/rankings', label: '랭킹', end: false, icon: IconRanking },
  { to: '/map', label: '지도', end: false, icon: IconMap },
  { to: '/search', label: '검색', end: false, icon: IconSearch },
  { to: '/me', label: '내 표', end: false, icon: IconMyVote },
] as const

const tabClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-bold leading-none no-underline transition-colors',
    isActive ? 'text-[#2A1A12]' : 'text-[#8A7A6A]',
  ].join(' ')

export function BottomNav() {
  return (
    <>
      <div className="h-[calc(68px+env(safe-area-inset-bottom,0px))]" aria-hidden />

      <nav
        aria-label="하단 네비게이션"
        className="fixed bottom-0 left-0 z-[100] box-content flex h-[68px] w-full items-stretch border-t border-[#E8D9BF] bg-[#FFFDF4] pb-[env(safe-area-inset-bottom,0px)]"
      >
        {TABS.map(({ to, label, end, icon: Icon }) => (
          <NavLink key={to} to={to} end={end} className={tabClass}>
            {({ isActive }) => (
              <>
                <Icon active={isActive} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  )
}

type IconProps = { active?: boolean }

const activeColor = '#2A1A12'
const inactiveColor = '#8A7A6A'

function IconRanking({ active }: IconProps) {
  const c = active ? activeColor : inactiveColor
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      {/* 트로피 컵 */}
      <path
        d="M8 3h8v7a4 4 0 0 1-8 0V3Z"
        stroke={c}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={active ? c : 'none'}
        fillOpacity={active ? 0.12 : 0}
      />
      <path d="M8 6H5a2 2 0 0 0 0 4h3M16 6h3a2 2 0 0 1 0 4h-3" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 14v3M9 20h6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 17h8" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconMap({ active }: IconProps) {
  const c = active ? activeColor : inactiveColor
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 7.5 9 5l6 3 6-2.5v12L15 20l-6-3-6 2.5V7.5Z"
        stroke={c}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={active ? c : 'none'}
        fillOpacity={active ? 0.1 : 0}
      />
      <path d="M9 5v12M15 8v12" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconSearch({ active }: IconProps) {
  const c = active ? activeColor : inactiveColor
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="11"
        cy="11"
        r="6"
        stroke={c}
        strokeWidth="1.8"
        fill={active ? c : 'none'}
        fillOpacity={active ? 0.12 : 0}
      />
      <path d="M16 16l4 4" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconMyVote({ active }: IconProps) {
  const c = active ? activeColor : inactiveColor
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      {/* 투표함 */}
      <rect
        x="4"
        y="12"
        width="16"
        height="9"
        rx="1.5"
        stroke={c}
        strokeWidth="1.8"
        fill={active ? c : 'none'}
        fillOpacity={active ? 0.12 : 0}
      />
      <path d="M4 15h16" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 3h6a1 1 0 0 1 1 1v8H8V4a1 1 0 0 1 1-1Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 7.5l1.5 1.5L14 6" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
