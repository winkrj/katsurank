import { KAKAO_LOGIN_URL } from '../../../shared/constant/api'
import { saveLoginRedirect } from '../../../shared/lib/loginRedirect'
import { useMeQuery } from '../../../shared/queries/me'
import { useAuthStore } from '../../../shared/stores/authStore'

type MyVoteCardProps = {
  onOpenDetail: (id: number) => void
}

export function MyVoteCard({ onOpenDetail }: MyVoteCardProps) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn())
  const { data: me } = useMeQuery(isLoggedIn)
  const currentVote = me?.currentVote ?? null

  return (
    <div className="rounded-xl border border-[#E8D9BF] bg-white p-4">
      <p className="text-[13px] font-black text-[#2A1A12]">내 한 표</p>
      {isLoggedIn && currentVote ? (
        <>
          <p className="mt-0.5 truncate text-[13px] font-bold text-[#2A1A12]">
            {currentVote.restaurantName}
          </p>
          {currentVote.rank && (
            <p className="mt-0.5 text-[12px] text-[#8A7A6A]">서울 {currentVote.rank}위</p>
          )}
          <button
            type="button"
            onClick={() => onOpenDetail(currentVote.restaurantId)}
            className="mt-3 block w-full rounded-xl border border-[#DBBA24] bg-[#FFC533] py-2.5 text-center text-[14px] font-black text-[#2A1A12] transition hover:bg-[#D88A24]"
          >
            내 표 확인하기
          </button>
        </>
      ) : isLoggedIn ? (
        <p className="mt-0.5 text-[12px] text-[#8A7A6A]">
          아직 투표하지 않았어요. 지도에서 가게를 찾아 투표해 보세요!
        </p>
      ) : (
        <>
          <p className="mt-0.5 text-[12px] text-[#8A7A6A]">아직 투표하지 않았어요.</p>
          <a
            href={KAKAO_LOGIN_URL}
            onClick={saveLoginRedirect}
            className="mt-3 block w-full rounded-xl border border-[#DBBA24] bg-[#FFC533] py-2.5 text-center text-[14px] font-black text-[#2A1A12] transition hover:bg-[#D88A24]"
          >
            로그인 후 투표하기
          </a>
        </>
      )}
    </div>
  )
}
