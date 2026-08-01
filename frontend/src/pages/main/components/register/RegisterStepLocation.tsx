import { useEffect, useRef } from 'react'
import { Button } from '../../../../shared/ui/Button'
import type { KakaoPlace } from '../../types/registerFlow'

function loadKakaoSdk(appkey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.kakao?.maps) { resolve(); return }
    const existing = document.querySelector('script[src^="//dapi.kakao.com/v2/maps/sdk.js"]')
    if (existing) {
      existing.addEventListener('load', () => window.kakao.maps.load(resolve))
      existing.addEventListener('error', reject)
      return
    }
    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&autoload=false`
    script.onload = () => window.kakao.maps.load(resolve)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

type RegisterMapPreviewProps = {
  place: KakaoPlace
}

function RegisterMapPreview({ place }: RegisterMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const appkey = import.meta.env.VITE_KAKAO_MAP_APP_KEY as string | undefined
    if (!containerRef.current || !appkey) return

    let cancelled = false

    loadKakaoSdk(appkey).then(() => {
      if (cancelled || !containerRef.current) return

      const { maps } = window.kakao
      const center = new maps.LatLng(place.latitude, place.longitude)
      const map = new maps.Map(containerRef.current, {
        center,
        level: 4,
        draggable: false,
        scrollwheel: false,
        disableDoubleClick: true,
        disableDoubleClickZoom: true,
      })

      const content = document.createElement('div')
      content.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
          <div style="
            background:#ffffff;
            color:#2A1A12;
            font-size:13px;
            font-weight:900;
            padding:5px 12px;
            border-radius:999px;
            white-space:nowrap;
            box-shadow:0 2px 8px rgba(0,0,0,0.15);
            border:2px solid #ada9a0;
          ">${place.name}</div>
          <svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 0C3.13 0 0 3.13 0 7c0 5.25 7 11 7 11s7-5.75 7-11c0-3.87-3.13-7-7-7Z" fill="#ffffff" stroke="#ada9a0" stroke-width="1.2"/>
            <circle cx="7" cy="7" r="2.5" fill="#2A1A12"/>
          </svg>
        </div>
      `
      new maps.CustomOverlay({ position: center, content, yAnchor: 1 }).setMap(map)
    })

    return () => { cancelled = true }
  }, [place.latitude, place.longitude, place.name])

  return (
    <div className="overflow-hidden rounded-xl border border-[#E8D9BF]">
      <div ref={containerRef} className="aspect-[16/9] w-full bg-[#E8E4D8]" />
      <p className="border-t border-[#E8D9BF] bg-white px-3 py-2 text-[11px] text-[#8A7A6A]">
        📍 {place.roadAddress}
      </p>
    </div>
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
        <h2 className="text-[17px] font-black text-[#2A1A12]">Step 2. 장소 확인</h2>
        <p className="mt-1 text-[13px] text-[#8A7A6A]">지도에서 위치를 확인해 주세요.</p>
      </div>

      <div className="rounded-xl border border-[#E8D9BF] bg-[#FFFDF4] p-4">
        <p className="text-[16px] font-black text-[#2A1A12]">{place.name}</p>
        <p className="mt-1 text-[13px] text-[#8A7A6A]">{place.roadAddress}</p>
      </div>

      <RegisterMapPreview place={place} />

      <dl className="grid gap-3 text-[13px]">
        <InfoRow label="전화" value={place.phone || '정보 없음'} />
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
