import { Link } from 'react-router-dom'
import { HomeHeaderAuth } from './HomeHeaderAuth'

export function HomeHeaderMobile() {
  return (
    <header className="fixed left-0 top-0 z-50 flex h-14 w-full items-center justify-between border-b border-[#E8D9BF]/70 bg-white/95 px-4 backdrop-blur-md">
      <Link to="/" className="flex h-full items-center">
        <img src="/images/katsurank_logo.png" alt="카츠랭" className="h-9 w-auto object-contain" />
      </Link>

      <HomeHeaderAuth variant="mobile" />
    </header>
  )
}
