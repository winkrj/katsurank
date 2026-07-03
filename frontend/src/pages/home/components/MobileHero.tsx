import { HeroHeading } from './HeroHeading'
import { RankingList } from './RankingList'
import { VoteButtons } from './VoteButtons'

export function MobileHero() {
  return (
    <section className="mobile-hero relative">
      <div className="mobile-hero__bg pointer-events-none absolute inset-x-0 top-0 opacity-45">
        <img
          src="/images/main-seoul-pixel-bg.png"
          alt=""
          className="size-full object-cover [image-rendering:pixelated]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#FFFDF4]" />
      </div>

      <div className="mobile-hero__content relative z-10">
        <div className="mobile-hero__content-header">
          <HeroHeading variant="mobile" />
          <VoteButtons layout="mobile" />
        </div>

        <RankingList layout="mobile" />
      </div>
    </section>
  )
}
