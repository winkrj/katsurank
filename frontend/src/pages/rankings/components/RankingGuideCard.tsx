import { Link } from 'react-router-dom'
import { useAuthStore } from '../../../shared/stores/authStore'

const GUIDE_ITEMS = [
  {
    icon: '1',
    title: '1인 1표 원칙',
    desc: '하루에 한 곳만 투표할 수 있어요.',
  },
  {
    icon: '⇄',
    title: '표는 이동 가능',
    desc: '이전 투표를 취소하고 새로 투표할 수 있어요.',
  },
  {
    icon: '👑',
    title: '랭킹 기준',
    desc: '최근 7일 동안 받은 총 득표수 기준이에요.',
  },
] as const

export function RankingGuideCard() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn())

  return (
    <aside className="flex flex-col gap-4 rounded-xl border border-[#E6D5B8] bg-white p-4 shadow-[0_4px_16px_rgba(58,35,24,0.06)]">
      <p className="flex items-center gap-1.5 text-[13px] font-black text-[#2A1A12]">
        <span className="text-[#D88A24]">⊟</span> 카츠랭 가이드
      </p>

      <ul className="flex flex-col gap-4">
        {GUIDE_ITEMS.map((item) => (
          <li key={item.title} className="flex gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#E8D9BF] bg-[#FFF4D8] text-[13px] font-black text-[#D88A24]">
              {item.icon}
            </span>
            <div>
              <p className="text-[13px] font-black text-[#2A1A12]">{item.title}</p>
              <p className="mt-0.5 text-[12px] leading-snug text-[#5F4A3C]">{item.desc}</p>
            </div>
          </li>
        ))}
      </ul>

      {isLoggedIn && (
        <Link
          to="/me"
          className="mt-1 block w-full rounded-xl border border-[#DBBA24] bg-[#FFC533] py-2.5 text-center text-[14px] font-black text-[#2A1A12] transition hover:bg-[#D88A24]"
        >
          내 표 확인하기
        </Link>
      )}
    </aside>
  )
}
