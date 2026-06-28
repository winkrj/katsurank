import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { HOME_NAV_MY_VOTE_LINK, HOME_NAV_PUBLIC_LINKS } from './navLinks'
import { HomeHeaderAuth } from './HomeHeaderAuth'

export function HomeHeaderDesktop() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn())

  return (
    <header className="fixed left-0 top-0 z-50 flex h-20 w-full items-center justify-between border-b border-[#E8D9BF]/70 bg-[#FFFDF4]/90 px-13 py-4 backdrop-blur-md">
      <Link to="/" className="flex h-full shrink-0 items-center">
        <img src="/images/katsurank_logo.png" alt="카츠랭" className="h-13 w-auto object-contain" />
      </Link>

      <nav className="flex items-center gap-9 text-[18px] font-bold">
        {HOME_NAV_PUBLIC_LINKS.map(({ to, label }) => (
          <Link key={to} to={to} className="hover:text-[#D88A24]">
            {label}
          </Link>
        ))}
        {isLoggedIn && (
          <Link to={HOME_NAV_MY_VOTE_LINK.to} className="hover:text-[#D88A24]">
            {HOME_NAV_MY_VOTE_LINK.label}
          </Link>
        )}
      </nav>

      <HomeHeaderAuth />
    </header>
  )
}
