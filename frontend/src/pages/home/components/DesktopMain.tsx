import { useAuthStore } from '../../../shared/stores/authStore'
import { MAP_PIN_POSITIONS } from '../constants'
import { HeroHeading } from './HeroHeading'
import { MapPin } from './MapPin'
import { RankingList } from './RankingList'
import { VoteButtons } from './VoteButtons'

export function DesktopMain() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn())

  return (
    <section className="relative grid min-h-screen grid-cols-[minmax(var(--width-left-section),var(--width-left-section))_1fr] pt-[64px]">
      <div className="relative z-10 flex items-center px-6 py-[30px] lg:px-12 xl:px-20">
        <div className="w-full max-w-[var(--width-left-section)]">
          <HeroHeading variant="desktop" />

          <div className="mb-9">
            <VoteButtons isLoggedIn={isLoggedIn} />
          </div>

          <RankingList />
        </div>
      </div>

      <div className="relative">
        <img
          src="/images/main-seoul-pixel-bg.png"
          alt="픽셀아트 스타일의 서울 지도 배경 이미지"
          className="absolute inset-0 size-full object-cover object-center [image-rendering:pixelated]"
        />
        <div className="absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(90deg,#FFFDF4_0%,rgba(255,253,244,0.3)_50%,rgba(255,253,244,0)_100%)]" />
      </div>

      {MAP_PIN_POSITIONS.map(({ rank, className }) => (
        <MapPin key={rank} rank={rank} className={className} />
      ))}

      <div className="absolute bottom-[12%] right-[8%] z-10 rounded-lg border-2 border-[#3A2318] bg-[#FFFDF4] px-4 py-3 text-[13px] font-black leading-snug shadow-[3px_3px_0_rgba(42,26,18,0.25)]">
        지도를 움직여
        <br />
        맛집을 찾아보세요!
      </div>
    </section>
  )
}
