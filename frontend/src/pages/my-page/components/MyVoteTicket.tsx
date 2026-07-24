import { Link } from 'react-router-dom';
import { formatDateKST } from '../../../shared/lib/formatDate';

type MyVoteTicketProps = {
  restaurantId: number;
  restaurantName: string;
  restaurantImage?: string;
  rank: number | null;
  votes: number | null;
  votedAt: string;
  layout: 'desktop' | 'mobile';
};

export function MyVoteTicket({
  restaurantId,
  restaurantName,
  restaurantImage = '/images/shop_default_img.png',
  rank,
  votes,
  votedAt,
  layout,
}: MyVoteTicketProps) {
  const isDesktop = layout === 'desktop';

  return (
    <div
      className={
        isDesktop
          ? 'flex justify-center relative overflow-hidden rounded-2xl px-10 py-8'
          : 'flex justify-center relative overflow-hidden rounded-2xl px-8 pb-8 pt-12'
      }
      style={{
        backgroundImage: isDesktop
          ? 'url(/images/my_vote_bg_img_desktop.png)'
          : 'url(/images/my_vote_bg_img_mobile.png)',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        boxShadow: '0 8px 32px rgba(199,131,22,0.25)',
      }}
    >
      <div className="flex flex-col justify-center">
        {isDesktop ? (
          /* 데스크탑: 이미지 왼쪽 + 정보 오른쪽 */
          <div className="flex items-center gap-8">
            <RestaurantImage src={restaurantImage} name={restaurantName} size={120} />
            <div className="flex flex-1 flex-col items-center gap-2">
              <p className="text-[11px] font-black tracking-[0.2em] text-[#C78316]">MY ONE PICK</p>
              <div className="flex flex-col items-center">
                <CrownIcon />
                <h2 className="text-[28px] font-black text-[#2A1A12]">{restaurantName}</h2>
              </div>
              <RankBadge rank={rank} votes={votes} />
            </div>
          </div>
        ) : (
          /* 모바일: 세로 스택 */
          <div className="flex flex-col items-center gap-3">
            <p className="text-[11px] font-black tracking-[0.2em] text-[#C78316]">MY ONE PICK</p>
            <RestaurantImage src={restaurantImage} name={restaurantName} size={96} />
            <CrownIcon />
            <h2 className="text-[22px] font-black text-[#2A1A12]">{restaurantName}</h2>
            <RankBadge rank={rank} votes={votes} />
          </div>
        )}

        {/* 점선 구분 */}
        <div className="mt-5 mb-3 border-t border-dashed border-[#D9A83A]" />

        {/* 하단: 날짜 + 상세보기 */}
        <div className="flex items-center justify-between gap-4 mb-4 px-3">
          <p className="shrink-0 text-[13px] text-[#8A7A6A]">
            투표한 날짜&nbsp;&nbsp;
            <span className="font-bold text-[#2A1A12]">{formatDateKST(votedAt)}</span>
          </p>
          <Link
            to={`/restaurants/${restaurantId}`}
            className="flex shrink-0 items-center gap-1 rounded-xl border border-[#C78316] bg-white px-4 py-2 text-[13px] font-bold text-[#2A1A12] shadow-sm transition hover:bg-[#FFF4D8]"
          >
            상세보기 <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function RestaurantImage({ src, name, size }: { src: string; name: string; size: number }) {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-full bg-[#E8D9BF]"
      style={{
        width: size,
        height: size,
        border: '4px solid #C78316',
        boxShadow: '0 0 0 2px #E8C97A',
      }}
    >
      <img src={src} alt={name} className="size-full object-cover" />
    </div>
  );
}

function RankBadge({ rank, votes }: { rank: number | null; votes: number | null }) {
  return (
    <div className="rounded-full bg-[#D88A24] px-5 py-2 text-[14px] font-black text-white shadow-[0_3px_0_#A86010]">
      {rank != null ? `현재 ${rank}위 · ` : ''}
      {votes != null ? `${votes.toLocaleString()}표` : '집계 중'}
    </div>
  );
}

function CrownIcon() {
  return (
    <svg width="28" height="24" viewBox="0 0 32 28" fill="none" aria-hidden>
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
  );
}
