import { Link } from 'react-router-dom'

type SearchRegisterCardProps = {
  layout?: 'desktop' | 'mobile'
}

export function SearchRegisterCard({ layout = 'desktop' }: SearchRegisterCardProps) {
  const isMobile = layout === 'mobile'

  return (
    <section
      className={
        isMobile
          ? 'rounded-2xl border border-[#E8D9BF] bg-white p-4 shadow-[0_8px_20px_rgba(58,35,24,0.05)]'
          : 'mt-5 rounded-2xl border border-[#E8D9BF] bg-white p-5 shadow-[0_8px_24px_rgba(58,35,24,0.06)]'
      }
    >
      <h2 className="mb-2 text-[15px] font-black text-[#2A1A12]">찾는 가게가 없나요?</h2>
      <p className="mb-4 text-[13px] leading-relaxed text-[#8A7A6A]">
        카카오맵 검색 결과에서 새 가게를 등록할 수 있어요.
      </p>
      <Link
        to="/restaurants/new"
        className="flex h-11 w-full items-center justify-center rounded-lg border-2 border-[#E8D9BF] bg-[#FFFDF4] text-[14px] font-bold text-[#2A1A12] transition hover:border-[#D88A24] hover:bg-[#FFF4D8]"
      >
        + 새 가게 등록하기
      </Link>
    </section>
  )
}
