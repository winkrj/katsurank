import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import '../styles/pages.css'

type PageShellProps = {
  title: string
  children: ReactNode
}

const DEV_LINKS = [
  { to: '/', label: '메인' },
  { to: '/restaurants/1', label: '가게 상세' },
  { to: '/restaurants/new', label: '가게 추가' },
  { to: '/me', label: '마이페이지' },
  { to: '/terms', label: '약관' },
  { to: '/privacy', label: '개인정보' },
] as const

export function PageShell({ title, children }: PageShellProps) {
  return (
    <main className="page">
      <nav className="page__nav" aria-label="개발용 페이지 이동">
        {DEV_LINKS.map(({ to, label }) => (
          <Link key={to} to={to}>
            {label}
          </Link>
        ))}
      </nav>
      <h1>{title}</h1>
      {children}
    </main>
  )
}
