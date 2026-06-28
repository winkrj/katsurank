import { Button } from '../../../shared/ui/Button'
import type { KakaoPlace } from '../types/registerFlow'

type RegisterMapPreviewProps = {
  place: KakaoPlace
}

export function RegisterMapPreview({ place }: RegisterMapPreviewProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[#E8D9BF] bg-[#E8E4D8]">
      <div className="aspect-[16/10] w-full bg-[linear-gradient(180deg,#E8E4D8_0%,#D4CFC0_100%)]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#2A1A12] px-2 py-1 text-[11px] font-bold text-white">
              {place.name}
            </span>
            <MapPinIcon />
          </div>
        </div>
      </div>
      <p className="border-t border-[#E8D9BF] bg-white px-3 py-2 text-[11px] text-[#8A7A6A]">
        지도 미리보기 (카카오맵 SDK 연동 예정) · {place.latitude.toFixed(4)},{' '}
        {place.longitude.toFixed(4)}
      </p>
    </div>
  )
}

function MapPinIcon() {
  return (
    <svg width="32" height="40" viewBox="0 0 32 40" fill="none" aria-hidden>
      <path
        d="M16 0C9.4 0 4 5.4 4 12c0 9 12 28 12 28s12-19 12-28c0-6.6-5.4-12-12-12Z"
        fill="#E53935"
      />
      <circle cx="16" cy="12" r="5" fill="white" />
    </svg>
  )
}

type RegisterStepLocationProps = {
  place: KakaoPlace
  onPrev: () => void
  onNext: () => void
}

export function RegisterStepLocation({ place, onPrev, onNext }: RegisterStepLocationProps) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-[17px] font-black text-[#2A1A12]">Step 2. 장소 선택</h2>
        <p className="mt-1 text-[13px] text-[#8A7A6A]">이 장소가 맞나요?</p>
      </div>

      <div className="rounded-xl border border-[#E8D9BF] bg-[#FFFDF4] p-4">
        <p className="text-[16px] font-black text-[#2A1A12]">{place.name}</p>
        <p className="mt-1 text-[13px] text-[#8A7A6A]">{place.roadAddress}</p>
      </div>

      <RegisterMapPreview place={place} />

      <dl className="grid gap-3 text-[13px]">
        <InfoRow label="전화" value={place.phone} />
        <InfoRow label="카테고리" value={place.category} />
      </dl>

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1 rounded-xl" onClick={onPrev}>
          이전 단계
        </Button>
        <Button variant="primary" className="flex-1 rounded-xl" onClick={onNext}>
          다음 단계
        </Button>
      </div>
    </section>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 border-b border-[#F0E3CC] pb-3 last:border-b-0">
      <dt className="w-16 shrink-0 font-bold text-[#5F4A3C]">{label}</dt>
      <dd className="text-[#2A1A12]">{value}</dd>
    </div>
  )
}
