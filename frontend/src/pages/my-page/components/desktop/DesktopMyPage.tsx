import { MOCK_MY_VOTE } from '../../mocks/myVote.mock';
import { MyVoteBanner } from '../MyVoteBanner';
import { MyVoteInfoCard } from '../MyVoteInfoCard';
import { MyVoteSearchSection } from '../MyVoteSearchSection';
import { MyVoteTicket } from '../MyVoteTicket';

export function DesktopMyPage() {
  const vote = MOCK_MY_VOTE;

  return (
    <div className="min-h-screen bg-[#FFFDF4] pt-20 text-[#2A1A12]">
      <MyVoteBanner layout="desktop" />

      <div className="mx-auto max-w-[900px] space-y-5 px-6 py-8">
        {/* 티켓 + 안내 카드 */}
        <div className="grid grid-cols-[1fr_280px] gap-5">
          <MyVoteTicket
            restaurantId={vote.restaurantId}
            restaurantName={vote.restaurantName}
            restaurantImage={vote.restaurantImage}
            rank={vote.rank}
            votes={vote.votes}
            votedAt={vote.votedAt}
            layout="desktop"
          />
          <MyVoteInfoCard layout="desktop" />
        </div>

        {/* 검색 섹션 */}
        <MyVoteSearchSection layout="desktop" />
      </div>
    </div>
  );
}
