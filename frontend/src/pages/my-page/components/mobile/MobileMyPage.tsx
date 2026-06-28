import { MOCK_MY_VOTE } from '../../mocks/myVote.mock'
import { MyVoteBanner } from '../MyVoteBanner'
import { MyVoteInfoCard } from '../MyVoteInfoCard'
import { MyVoteSearchSection } from '../MyVoteSearchSection'
import { MyVoteTicket } from '../MyVoteTicket'

export function MobileMyPage() {
  const vote = MOCK_MY_VOTE

  return (
    <main className="min-h-screen bg-[#FFFDF4] pb-[calc(68px+env(safe-area-inset-bottom,0px))] pt-14 text-[#2A1A12]">
      <MyVoteBanner layout="mobile" />

      <div className="space-y-4 px-4 py-5">
        <MyVoteTicket
          restaurantId={vote.restaurantId}
          restaurantName={vote.restaurantName}
          restaurantImage={vote.restaurantImage}
          rank={vote.rank}
          votes={vote.votes}
          votedAt={vote.votedAt}
          layout="mobile"
        />
        <MyVoteInfoCard layout="mobile" />
        <MyVoteSearchSection layout="mobile" />
      </div>
    </main>
  )
}
