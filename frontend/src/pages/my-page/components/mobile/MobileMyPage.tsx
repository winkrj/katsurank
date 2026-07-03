import { Skeleton } from '../../../../shared/ui/Skeleton'
import { useMeQuery } from '../../../../shared/queries/me'
import { useRestaurantQuery } from '../../../../shared/queries/restaurants'
import { MyVoteBanner } from '../MyVoteBanner'
import { MyVoteInfoCard } from '../MyVoteInfoCard'
import { MyVoteSearchSection } from '../MyVoteSearchSection'
import { MyVoteTicket } from '../MyVoteTicket'

export function MobileMyPage() {
  const { data: me, isLoading } = useMeQuery()
  const vote = me?.currentVote ?? null

  const { data: restaurant } = useRestaurantQuery(vote?.restaurantId ?? 0)

  return (
    <main className="min-h-screen bg-[#FFFDF4] pb-[calc(68px+env(safe-area-inset-bottom,0px))] pt-14 text-[#2A1A12]">
      <MyVoteBanner layout="mobile" />

      <div className="space-y-4 px-4 py-5">
        {isLoading ? (
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
