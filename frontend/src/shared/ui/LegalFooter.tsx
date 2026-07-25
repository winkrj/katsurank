import { Link } from 'react-router-dom'

export function LegalFooter() {
  return (
    <footer className="flex items-center justify-center gap-4 border-t border-[#E8D9BF]/70 bg-[#FFFDF4] px-5 py-6 text-[12px] font-bold text-[#8A7A6A]">
      <Link to="/privacy" className="hover:text-[#2A1A12]">
        개인정보처리방침
      </Link>
      <span className="text-[#E8D9BF]">|</span>
      <Link to="/terms" className="hover:text-[#2A1A12]">
        이용약관
      </Link>
    </footer>
  )
}
