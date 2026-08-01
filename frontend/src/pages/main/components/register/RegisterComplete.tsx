import { Button } from '../../../../shared/ui/Button'
import { DialogCrownIcon } from '../../../../shared/ui/dialog'
import type { RegisterCompleteResult } from '../../types/registerFlow'

type RegisterCompleteProps = {
  result: RegisterCompleteResult
  layout?: 'desktop' | 'mobile'
  onViewDetail: (id: number) => void
  onClose: () => void
}

export function RegisterComplete({ result, layout = 'desktop', onViewDetail, onClose }: RegisterCompleteProps) {
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
          variant="primary"
          className="w-full rounded-xl"
          onClick={() => onViewDetail(result.restaurantId)}
        >
          바로 투표하러 가기
        </Button>
        <button
          type="button"
          onClick={onClose}
          className="inline-block pt-2 text-[13px] font-bold text-[#8A7A6A] hover:text-[#5F4A3C]"
        >
          닫기
        </button>
      </div>
    </section>
  )
}
