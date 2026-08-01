import { KAKAO_LOGIN_URL } from '../../../../shared/constant/api'
import { saveLoginRedirect } from '../../../../shared/lib/loginRedirect'
import { useAuthStore } from '../../../../shared/stores/authStore'
import { Skeleton } from '../../../../shared/ui/Skeleton'
import { useMeQuery } from '../../../../shared/queries/me'
import { useRestaurantQuery } from '../../../../shared/queries/restaurants'
import { MyVoteBanner } from '../MyVoteBanner'
import { MyVoteInfoCard } from '../MyVoteInfoCard'
import { MyVoteSearchSection } from '../MyVoteSearchSection'
import { MyVoteTicket } from '../MyVoteTicket'

export function MobileMyPage() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn())
  const { data: me, isLoading } = useMeQuery(isLoggedIn)
  const vote = me?.currentVote ?? null

  const { data: restaurant } = useRestaurantQuery(vote?.restaurantId ?? 0)

  return (
    <main className="min-h-screen bg-[#FFFDF4] pb-[calc(68px+env(safe-area-inset-bottom,0px))] pt-14 text-[#2A1A12]">
      <MyVoteBanner layout="mobile" />

      <div className="space-y-4 px-4 py-5">
        {!isLoggedIn ? (
          <div className="rounded-2xl border border-[#E8D9BF] bg-white p-6 text-center">
            <p className="text-[14px] font-bold text-[#2A1A12]">로그인이 필요해요.</p>
            <p className="mt-1 text-[12px] text-[#8A7A6A]">
              카카오 로그인 후 내 표를 확인할 수 있어요.
            </p>
            <a
              href={KAKAO_LOGIN_URL}
              onClick={saveLoginRedirect}
              className="mt-4 inline-flex h-[44px] items-center justify-center gap-1.5 rounded-xl border-2 border-[#DBBA24] bg-[#FFC533] px-6 text-[13px] font-black text-[#2A1A12]"
            >
              <img src="/images/kakao_icon.png" alt="" className="size-4" aria-hidden />
              카카오 로그인
            </a>
          </div>
        ) : isLoading ? (
          <Skeleton className="h-[220px] rounded-2xl" />
        ) : vote ? (
          <MyVoteTicket
            restaurantId={vote.restaurantId}
            restaurantName={vote.restaurantName}
            rank={restaurant?.rank ?? null}
            votes={restaurant?.voteCount ?? null}
            votedAt={vote.votedAt}
            layout="mobile"
          />
        ) : (
          <div className="rounded-2xl border border-[#E8D9BF] bg-white p-6 text-center">
            <p className="text-[14px] font-bold text-[#2A1A12]">아직 투표하지 않았어요.</p>
            <p className="mt-1 text-[12px] text-[#8A7A6A]">마음에 드는 돈까스 가게에 내 한 표를 던져보세요!</p>
          </div>
        )}
        <MyVoteInfoCard layout="mobile" />
        <MyVoteSearchSection layout="mobile" />
      </div>
    </main>
  )
}
