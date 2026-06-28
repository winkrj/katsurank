import { Link } from 'react-router-dom'

const PROMO_ITEMS = [
  {
    icon: '👑',
    title: '당신의 한 표가\n랭킹을 만들어요!',
    desc: '맛있는 돈까스집을 발견했다면 지금 바로 투표해보세요!',
    link: null,
  },
  {
    icon: '📍',
    title: '지도에서 발견하고',
    desc: '지도에서 마음에 드는 돈까스집을 찾아보세요.',
    link: { to: '/map', label: '지도 보기' },
  },
  {
    icon: '🗳️',
    title: '한 표를 던지고',
    desc: '하루에 한 번, 당신의 최애 돈까스집에 투표해 주세요.',
    link: null,
  },
  {
    icon: '🏆',
    title: '랭킹을 올려줘요!',
    desc: '여러분의 투표로 맛있는 돈까스집이 더 빛날 수 있어요.',
    link: null,
  },
] as const

type RankingPromoSectionProps = {
  layout?: 'desktop' | 'mobile'
}

export function RankingPromoSection({ layout = 'desktop' }: RankingPromoSectionProps) {
  const isDesktop = layout === 'desktop'

  if (!isDesktop) {
    const first = PROMO_ITEMS[0]
    return (
      <div className="mx-4 my-4 flex items-center gap-3 rounded-xl border border-[#E8D9BF] bg-white p-4">
        <span className="text-[32px]">{first.icon}</span>
        <div>
          <p className="text-[14px] font-black text-[#2A1A12]">{first.title.replace('\n', ' ')}</p>
          <p className="text-[12px] text-[#5F4A3C]">{first.desc}</p>
        </div>
        <ChevronIcon />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-4 border-t border-[#E8D9BF] bg-[#FFF9EC] px-6 py-6">
      {PROMO_ITEMS.map((item) => (
        <div
          key={item.title}
          className="flex flex-col gap-2 rounded-xl border border-[#E8D9BF] bg-white p-4"
        >
          <span className="text-[28px]">{item.icon}</span>
          <p className="whitespace-pre-line text-[14px] font-black leading-snug text-[#2A1A12]">
            {item.title}
          </p>
          <p className="text-[12px] leading-relaxed text-[#5F4A3C]">{item.desc}</p>
          {item.link && (
            <Link
              to={item.link.to}
              className="mt-auto text-[13px] font-bold text-[#D88A24] hover:underline"
            >
              {item.link.label} →
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#8A7A6A" strokeWidth="2" strokeLinecap="round" className="ml-auto shrink-0" aria-hidden>
      <path d="M6 4l4 4-4 4" />
    </svg>
  )
}
