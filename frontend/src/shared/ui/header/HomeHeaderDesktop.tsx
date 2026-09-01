import { Link } from 'react-router-dom'
import { HomeHeaderAuth } from './HomeHeaderAuth'

export function HomeHeaderDesktop() {
  return (
    <header className="fixed left-0 top-0 z-50 flex h-20 w-full items-center justify-between border-b border-[#E8D9BF]/70 bg-white/90 px-13 py-4 backdrop-blur-md">
      <Link to="/" className="flex h-full shrink-0 items-center">
        <img src="/images/katsurank_logo.png" alt="카츠랭" className="h-13 w-auto object-contain" />
      </Link>

      <HomeHeaderAuth />
    </header>
  )
}
