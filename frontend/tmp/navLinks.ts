/** 데스크탑 헤더 — 비로그인 시에도 보이는 nav */
export const HOME_NAV_PUBLIC_LINKS = [
  { to: '/rankings', label: '랭킹' },
  { to: '/map', label: '지도' },
  { to: '/search', label: '검색' },
] as const

/** 데스크탑 헤더 — 로그인 시에만 표시 */
export const HOME_NAV_MY_VOTE_LINK = { to: '/me', label: '내 표' } as const
