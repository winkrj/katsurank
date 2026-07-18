import { Button } from '../../../shared/ui/Button'
import type { KakaoPlace } from '../types/registerFlow'

type RegisterStepConfirmProps = {
  place: KakaoPlace
  onPrev: () => void
  onSubmit: () => void
  isSubmitting?: boolean
}

export function RegisterStepConfirm({
  place,
  onPrev,
  onSubmit,
  isSubmitting = false,
}: RegisterStepConfirmProps) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-[17px] font-black text-[#2A1A12]">Step 3. 최종 확인</h2>
        <p className="mt-1 text-[13px] text-[#8A7A6A]">정보를 확인하고 등록해 주세요.</p>
      </div>

      <dl className="rounded-xl border border-[#E8D9BF] bg-[#FFFDF4] p-4 text-[13px]">
        <SummaryRow label="가게명" value={place.name} />
        <SummaryRow label="주소" value={place.roadAddress} />
        <SummaryRow label="전화" value={place.phone} />
        <SummaryRow label="카테고리" value={place.category} />
      </dl>

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1 rounded-xl" onClick={onPrev} disabled={isSubmitting}>
          이전 단계
        </Button>
        <Button
          variant="primary"
          className="flex-1 rounded-xl"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? '등록 중…' : '등록하기'}
        </Button>
      </div>
    </section>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 border-b border-[#F0E3CC] py-3 first:pt-0 last:border-b-0 last:pb-0">
      <dt className="w-16 shrink-0 font-bold text-[#5F4A3C]">{label}</dt>
      <dd className="text-[#2A1A12]">{value}</dd>
    </div>
  )
}
