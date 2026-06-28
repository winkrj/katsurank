import { Link } from 'react-router-dom'
import { Button } from '../../../shared/ui/Button'

type SearchEmptyStateProps = {
  hasQuery: boolean
}

export function SearchEmptyState({ hasQuery }: SearchEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-[#E8D9BF] bg-white px-6 py-12 text-center shadow-[0_8px_20px_rgba(58,35,24,0.05)]">
      <EmptyIcon />

      <h3 className="mt-4 text-[17px] font-black text-[#2A1A12]">
        {hasQuery ? '검색 결과가 없어요!' : '가게를 검색해 보세요'}
      </h3>
      <p className="mx-auto mt-2 max-w-[280px] text-[13px] leading-relaxed text-[#8A7A6A]">
        {hasQuery
          ? '다른 키워드로 검색하거나 새 가게를 등록해 보세요.'
          : '가게명 또는 지역을 입력하고 검색해 주세요.'}
      </p>

      <div className="mx-auto mt-6 flex max-w-[320px] flex-col gap-3">
        {hasQuery && (
          <Button tag="a" variant="primary" href="/restaurants/new" className="w-full rounded-xl">
            + 새 가게 등록하기
          </Button>
        )}
        <Link
          to="/"
          className="text-[13px] font-bold text-[#8A7A6A] hover:text-[#5F4A3C]"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}

function EmptyIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden className="mx-auto">
      <circle cx="28" cy="28" r="14" stroke="#E8D9BF" strokeWidth="3" />
      <path d="M38 38 48 48" stroke="#E8D9BF" strokeWidth="3" strokeLinecap="round" />
      <path d="M22 28h12M28 22v12" stroke="#FFC533" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
