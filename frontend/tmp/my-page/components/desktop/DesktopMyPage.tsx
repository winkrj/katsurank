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

export function DesktopMyPage() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn())
  const { data: me, isLoading } = useMeQuery(isLoggedIn)
  const vote = me?.currentVote ?? null

  const { data: restaurant } = useRestaurantQuery(vote?.restaurantId ?? 0)

  return (
    <div className="min-h-screen bg-[#FFFDF4] pt-20 text-[#2A1A12]">
      <MyVoteBanner layout="desktop" />

      <div className="mx-auto max-w-[900px] space-y-5 px-6 py-8">
        {!isLoggedIn ? (
          <div className="rounded-2xl border border-[#E8D9BF] bg-white p-8 text-center">
            <p className="text-[15px] font-bold text-[#2A1A12]">로그인이 필요해요.</p>
            <p className="mt-1 text-[13px] text-[#8A7A6A]">
              카카오 로그인 후 내 표를 확인할 수 있어요.
            </p>
            <a
              href={KAKAO_LOGIN_URL}
              onClick={saveLoginRedirect}
              className="mt-5 inline-flex h-[48px] items-center justify-center gap-1.5 rounded-xl border-2 border-[#DBBA24] bg-[#FFC533] px-6 text-[14px] font-black text-[#2A1A12]"
            >
              <img src="/images/kakao_icon.png" alt="" className="size-4" aria-hidden />
              카카오 로그인
            </a>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-[1fr_280px] gap-5">
            <Skeleton className="h-[200px] rounded-2xl" />
            <Skeleton className="h-[200px] rounded-2xl" />
          </div>
        ) : vote ? (
          <div className="grid grid-cols-[1fr_280px] gap-5">
            <MyVoteTicket
              restaurantId={vote.restaurantId}
              restaurantName={vote.restaurantName}
              rank={restaurant?.rank ?? null}
              votes={restaurant?.voteCount ?? null}
              votedAt={vote.votedAt}
              layout="desktop"
            />
            <MyVoteInfoCard layout="desktop" />
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E8D9BF] bg-white p-8 text-center">
            <p className="text-[15px] font-bold text-[#2A1A12]">아직 투표하지 않았어요.</p>
            <p className="mt-1 text-[13px] text-[#8A7A6A]">마음에 드는 돈까스 가게에 내 한 표를 던져보세요!</p>
          </div>
        )}

        <MyVoteSearchSection layout="desktop" />
      </div>
    </div>
  )
}
