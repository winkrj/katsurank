import { Link } from 'react-router-dom'
import { Button } from '../../../shared/ui/Button'
import { DialogCrownIcon } from '../../../shared/ui/dialog'
import type { RegisterCompleteResult } from '../types/registerFlow'

type RegisterCompleteProps = {
  result: RegisterCompleteResult
  layout?: 'desktop' | 'mobile'
}

export function RegisterComplete({ result, layout = 'desktop' }: RegisterCompleteProps) {
  const isMobile = layout === 'mobile'

  return (
    <section
      className={
        isMobile
          ? 'rounded-2xl border border-[#E8D9BF] bg-white px-5 py-10 text-center shadow-[0_8px_20px_rgba(58,35,24,0.05)]'
          : 'mx-auto max-w-[520px] rounded-2xl border border-[#E8D9BF] bg-white px-8 py-12 text-center shadow-[0_8px_24px_rgba(58,35,24,0.06)]'
      }
    >
      <DialogCrownIcon />

      <h2 className="mt-4 text-[20px] font-black leading-snug text-[#2A1A12]">
        {result.restaurantName}이(가)
        <br />
        등록되었어요!
      </h2>
      <p className="mt-3 text-[14px] leading-relaxed text-[#8A7A6A]">
        이제 다른 사용자들에게 소개해 보세요.
      </p>

      <div className="mt-8 space-y-3">
        <Button
          tag="a"
          variant="primary"
          href={`/restaurants/${result.restaurantId}`}
          className="w-full rounded-xl"
        >
          바로 투표하기
        </Button>
        <Button
          tag="a"
          variant="secondary"
          href={`/restaurants/${result.restaurantId}`}
          className="w-full rounded-xl"
        >
          가게 상세 보기
        </Button>
        <Link
          to="/search"
          className="inline-block pt-2 text-[13px] font-bold text-[#8A7A6A] hover:text-[#5F4A3C]"
        >
          검색으로 돌아가기
        </Link>
      </div>
    </section>
  )
}
