import type { ChangeEvent } from 'react'
import { Button } from '../../../shared/ui/Button'
import type { KakaoPlace } from '../types/registerFlow'

type RegisterStepConfirmProps = {
  place: KakaoPlace
  photoPreview: string | null
  onPhotoChange: (preview: string | null) => void
  onPrev: () => void
  onSubmit: () => void
  isSubmitting?: boolean
}

export function RegisterStepConfirm({
  place,
  photoPreview,
  onPhotoChange,
  onPrev,
  onSubmit,
  isSubmitting = false,
}: RegisterStepConfirmProps) {
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      onPhotoChange(null)
      return
    }
    onPhotoChange(URL.createObjectURL(file))
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-[17px] font-black text-[#2A1A12]">Step 3. 최종 확인</h2>
        <p className="mt-1 text-[13px] text-[#8A7A6A]">
          정보를 확인하고 사진을 추가한 뒤 등록해 주세요.
        </p>
      </div>

      <label className="block cursor-pointer">
        <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
        <div className="flex aspect-[16/10] flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#E8D9BF] bg-[#FFFDF4] transition hover:border-[#D88A24]">
          {photoPreview ? (
            <img src={photoPreview} alt="업로드 미리보기" className="size-full object-cover" />
          ) : (
            <>
              <PhotoIcon />
              <span className="mt-2 text-[14px] font-bold text-[#5F4A3C]">사진 추가하기</span>
              <span className="mt-1 text-[12px] text-[#8A7A6A]">선택 사항</span>
            </>
          )}
        </div>
      </label>

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

function PhotoIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="4" y="8" width="32" height="24" rx="3" stroke="#8A7A6A" strokeWidth="1.5" />
      <circle cx="14" cy="18" r="3" stroke="#8A7A6A" strokeWidth="1.5" />
      <path d="M8 28l8-8 6 6 4-4 6 6" stroke="#8A7A6A" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
