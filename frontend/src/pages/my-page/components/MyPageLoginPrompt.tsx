import { KAKAO_LOGIN_URL } from '../../../shared/constant/api'

const FEATURES = [
  { emoji: '1️⃣', label: '1인 1표 원칙' },
  { emoji: '↩️', label: '표 이동 가능' },
  { emoji: '📊', label: '실시간 랭킹 반영' },
] as const

export function MyPageLoginPrompt() {
  return (
    <main className="flex min-h-[calc(100vh-56px-68px-env(safe-area-inset-bottom,0px))] flex-col items-center justify-between bg-[#FFFDF4] px-6 pb-8 pt-10 text-[#2A1A12]">
      {/* 상단 일러스트 영역 */}
      <div className="flex flex-col items-center gap-6">
        {/* 왕관 장식 + 아이콘 */}
        <div className="relative flex items-center justify-center">
          {/* 배경 원 */}
          <div className="absolute size-[140px] rounded-full bg-[#FFF4D8]" />
          <div className="absolute size-[110px] rounded-full border-2 border-dashed border-[#E8C97A]" />

          {/* 메인 돈까스 아이콘 */}
          <div className="relative z-10 flex size-[88px] items-center justify-center rounded-full border-2 border-[#C78316] bg-[#FFC533] shadow-[0_4px_0_#C78316]">
            <img src="/images/katsu_icon.png" alt="돈까스" className="size-14 object-contain" />
          </div>

          {/* 왕관 */}
          <div className="absolute -top-3 z-20 flex -translate-y-1">
            <CrownIcon />
          </div>

          {/* 반짝이 장식 */}
          <SparkleIcon className="absolute -right-1 top-3 text-[#D88A24]" size={14} />
          <SparkleIcon className="absolute -left-2 bottom-4 text-[#FFC533]" size={10} />
          <SparkleIcon className="absolute right-2 bottom-0 text-[#E8C97A]" size={8} />
        </div>

        {/* 헤드카피 */}
        <div className="text-center">
          <p className="mb-1 text-[13px] font-bold text-[#8A7A6A]">로그인하고 투표해보세요</p>
          <h1 className="text-[24px] font-black leading-tight tracking-tight">
            내 한 표로
            <br />
            <span className="text-[#D88A24]">서울 1위</span>가 바뀐다!
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-[#5F4A3C]">
            지금 가장 맛있는 돈까스집에
            <br />
            당신만의 한 표를 던져보세요.
          </p>
        </div>

        {/* 피처 칩 */}
        <div className="flex flex-wrap justify-center gap-2">
          {FEATURES.map(({ emoji, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 rounded-full border border-[#E8D9BF] bg-white px-3.5 py-2 text-[12px] font-bold text-[#5F4A3C] shadow-[0_2px_0_#E8D9BF]"
            >
              {emoji} {label}
            </span>
          ))}
        </div>
      </div>

      {/* 구분선 + 투표 현황 미끼 */}
      <div className="my-6 w-full">
        <div className="rounded-2xl border border-[#E8D9BF] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(42,26,18,0.06)]">
          <p className="mb-3 text-[12px] font-bold text-[#8A7A6A]">현재 TOP 3</p>
          {[
            { rank: 1, name: '정돈 강남점', votes: '1,248표' },
            { rank: 2, name: '카츠바이콘반', votes: '982표' },
            { rank: 3, name: '오제제', votes: '671표' },
          ].map(({ rank, name, votes }) => (
            <div key={rank} className="flex items-center gap-3 py-1.5">
              <span
                className={[
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black',
                  rank === 1
                    ? 'bg-[#FFC533] text-[#3A2318]'
                    : rank === 2
                      ? 'bg-[#C8D4DC] text-white'
                      : 'bg-[#D99A4E] text-white',
                ].join(' ')}
              >
                {rank}
              </span>
              <span className="flex-1 text-[13px] font-bold text-[#2A1A12]">{name}</span>
              <span className="text-[12px] font-semibold text-[#5F4A3C]">{votes}</span>
            </div>
          ))}
          <p className="mt-3 text-center text-[11px] text-[#8A7A6A]">
            로그인하면 내 한 표를 던질 수 있어요 👇
          </p>
        </div>
      </div>

      {/* 카카오 로그인 */}
      <div className="w-full">
        <a
          href={KAKAO_LOGIN_URL}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#FEE500] py-4 text-[16px] font-black text-[#191919] shadow-[0_4px_0_#D4C000] transition active:translate-y-1 active:shadow-none"
        >
          <img src="/images/kakao_icon.png" alt="" className="size-5" aria-hidden />
          카카오로 1초 만에 시작하기
        </a>
        <p className="mt-3 text-center text-[11px] text-[#8A7A6A]">
          SNS 계정 정보를 따로 저장하지 않아요
        </p>
      </div>
    </main>
  )
}

function CrownIcon() {
  return (
    <svg width="32" height="28" viewBox="0 0 32 28" fill="none" aria-hidden>
      <path
        d="M2 22h28l2-16-8 6-8-12-8 12-8-6 2 16z"
        fill="#FFC533"
        stroke="#C78316"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="8" r="2" fill="#C78316" />
      <circle cx="16" cy="4" r="2" fill="#C78316" />
      <circle cx="26" cy="8" r="2" fill="#C78316" />
    </svg>
  )
}

function SparkleIcon({ className, size }: { className?: string; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M6 0l1.2 4.8L12 6l-4.8 1.2L6 12l-1.2-4.8L0 6l4.8-1.2z" />
    </svg>
  )
}
