import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { MyVoteCard } from '../MyVoteCard'
import { RankingPanel } from '../RankingPanel'

type RankingBottomSheetProps = {
  onSelectRestaurant: (id: number) => void
}

export function RankingBottomSheet({ onSelectRestaurant }: RankingBottomSheetProps) {
  const [open, setOpen] = useState(false)

  function handleSelect(id: number) {
    setOpen(false)
    onSelectRestaurant(id)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#2A1A12] bg-[#2A1A12] px-5 py-2.5 text-[13px] font-bold text-white shadow-lg"
      >
        <TrophyIcon />
        랭킹 보기
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[150] flex items-end">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="닫기"
              onClick={() => setOpen(false)}
            />
            <div className="relative z-10 max-h-[75vh] w-full overflow-y-auto rounded-t-2xl bg-[#FFFDF4] p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#E8D9BF]" aria-hidden />
              <div className="space-y-3">
                <MyVoteCard onOpenDetail={handleSelect} />
                <RankingPanel limit={100} onSelectRestaurant={handleSelect} />
                <div className="flex items-center justify-center gap-3 py-2 text-[11px] font-bold text-[#8A7A6A]">
                  <Link to="/privacy" className="hover:text-[#2A1A12]">
                    개인정보처리방침
                  </Link>
                  <span className="text-[#E8D9BF]">|</span>
                  <Link to="/terms" className="hover:text-[#2A1A12]">
                    이용약관
                  </Link>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

function TrophyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 3h8v7a4 4 0 0 1-8 0V3Z"
        stroke="#FFC533"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="#FFC533"
        fillOpacity="0.2"
      />
      <path d="M8 6H5a2 2 0 0 0 0 4h3M16 6h3a2 2 0 0 1 0 4h-3" stroke="#FFC533" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 14v3M9 20h6" stroke="#FFC533" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 17h8" stroke="#FFC533" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
