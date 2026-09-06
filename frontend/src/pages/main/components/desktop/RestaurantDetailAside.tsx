import { Toast } from '../../../../shared/ui/Toast';
import { useRestaurantRankingHistoryQuery } from '../../../../shared/queries/ranking';
import { CommentSection } from '../detail/CommentSection';
import { RankTrendChart } from '../detail/RankTrendChart';
import { RestaurantClosedBadge, RestaurantClosedNotice } from '../detail/RestaurantClosedStatus';
import { RestaurantVoteConfirmButton } from '../detail/RestaurantVoteConfirmButton';
import { useShareRestaurant } from '../../hooks/useShareRestaurant';
import { useRestaurantDetailQuery } from '../../queries/useRestaurantDetailQuery';

type RestaurantDetailAsideProps = {
  restaurantId: number;
  onClose: () => void;
};

export function RestaurantDetailAside({ restaurantId, onClose }: RestaurantDetailAsideProps) {
  const { data: restaurant, isPending, isError } = useRestaurantDetailQuery(restaurantId);
  const { share, toastMessage, dismissToast } = useShareRestaurant();
  const { data: rankingHistory, isPending: isHistoryPending } =
    useRestaurantRankingHistoryQuery(restaurantId);

  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-[#8A7A6A]">
        불러오는 중…
      </div>
    );
  }

  if (isError || !restaurant) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center text-[13px] text-[#5F4A3C]">
        가게를 찾을 수 없어요.
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-[#E8D9BF] px-3 py-1.5 text-[12px] font-bold hover:bg-[#FFF4D8]"
        >
          목록으로
        </button>
      </div>
    );
  }

  const isClosed = restaurant.status === 'CLOSED';
  const isOpen = restaurant.status === 'ACTIVE';

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* 상단: 순위 · 이름 · 공유 · 닫기 */}
      <div className="flex items-start justify-between gap-2 p-4 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          {restaurant.rank > 0 && (
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[#C78316] bg-[#FFC533] text-[12px] font-black text-[#3A2318]">
              {restaurant.rank}
            </span>
          )}
          <h2 className="truncate text-[18px] font-black text-[#2A1A12]">{restaurant.name}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => share(restaurant.id, restaurant.name)}
            aria-label="공유하기"
            className="flex size-7 items-center justify-center rounded-full text-[#8A7A6A] hover:bg-[#FFF4D8]"
          >
            <ShareIcon />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex size-7 items-center justify-center rounded-full text-[#8A7A6A] hover:bg-[#FFF4D8]"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {isClosed ? (
        <div className="space-y-4 px-4 pb-6">
          <RestaurantClosedBadge layout="mobile" />
          <p className="text-[13px] text-[#5F4A3C]">
            이 가게는 현재 폐업한 가게예요. 랭킹과 투표 대상에서 제외됐습니다.
          </p>

          <RestaurantClosedNotice layout="mobile" />

          <div className="flex items-center justify-between gap-2 rounded-lg border border-[#C9BCA4] bg-[#F4EFE6] px-4 py-3">
            <div>
              <p className="text-[12px] font-bold text-[#6B5A48]">이전 누적 투표</p>
              <p className="mt-1 text-[18px] font-black text-[#2A1A12]">
                {restaurant.totalVotes.toLocaleString()}표
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-full items-center justify-center rounded-lg border-2 border-[#DBBA24] bg-[#FFC533] text-[14px] font-black text-[#2A1A12] transition hover:bg-[#D88A24]"
          >
            다른 가게 찾기
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3 px-4">
            <p className="flex items-center gap-1 text-[13px] text-[#5F4A3C]">
              <LocationIcon />
              {restaurant.address}
            </p>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[14px] font-black text-[#2A1A12]">
                <VoteIcon />
                {restaurant.totalVotes.toLocaleString()}표
              </span>
              <span
                className={[
                  'rounded-full px-2 py-0.5 text-[11px] font-bold',
                  isOpen ? 'bg-[#EAF5EC] text-[#3D7A4A]' : 'bg-[#F4EFE6] text-[#8A7A6A]',
                ].join(' ')}
              >
                {isOpen ? '영업중' : '폐업'}
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#E8D9BF] bg-[#E8D9BF]">
              <img
                src={restaurant.images[0] ?? '/images/shop_default_img.png'}
                alt={restaurant.name}
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </div>

          <div className="mt-4 space-y-5 px-4 pb-6">
            <section className="space-y-3">
              <p className="text-[13px] font-black text-[#2A1A12]">정보</p>

              <ul className="space-y-2 text-[13px] text-[#5F4A3C]">
                <li className="flex gap-2">
                  <span className="shrink-0 text-[#8A7A6A]">
                    <ClockIcon />
                  </span>
                  {restaurant.hours}
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 text-[#8A7A6A]">
                    <PhoneIcon />
                  </span>
                  {restaurant.phone}
                </li>
              </ul>

              {restaurant.kakaoMapUrl && (
                <a
                  href={restaurant.kakaoMapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#E8D9BF] bg-white text-[13px] font-bold text-[#2A1A12] transition hover:border-[#D88A24] hover:bg-[#FFF4D8]"
                >
                  카카오맵으로 보기
                </a>
              )}

              <RestaurantVoteConfirmButton
                restaurantId={restaurant.id}
                restaurantName={restaurant.name}
                className="w-full rounded-xl"
              />
            </section>

            <hr className="border-[#E8D9BF]" />

            <section className="space-y-3">
              <p className="text-[13px] font-black text-[#2A1A12]">순위 히스토리</p>

              <div className="rounded-2xl border border-[#E8D9BF] bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[12px] font-bold text-[#5F4A3C]">최근 순위 추이 (최근 7일)</p>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[#8A7A6A]">
                    <span className="size-1.5 rounded-full bg-[#D88A24]" />
                    순위
                  </span>
                </div>
                {isHistoryPending ? (
                  <p className="py-8 text-center text-[12px] text-[#8A7A6A]">불러오는 중…</p>
                ) : !rankingHistory || rankingHistory.length === 0 ? (
                  <p className="py-8 text-center text-[12px] text-[#8A7A6A]">
                    아직 순위 데이터가 없어요.
                  </p>
                ) : (
                  <RankTrendChart data={rankingHistory} />
                )}
              </div>
            </section>

            <hr className="border-[#E8D9BF]" />

            <CommentSection restaurantId={restaurant.id} isActive={isOpen} />
          </div>
        </>
      )}

      <Toast message={toastMessage} onDismiss={dismissToast} />
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M2 2l10 10M12 2L2 12" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="13.5" cy="3.75" r="2.25" />
      <circle cx="4.5" cy="9" r="2.25" />
      <circle cx="13.5" cy="14.25" r="2.25" />
      <line x1="6.44" y1="10.13" x2="11.57" y2="12.62" />
      <line x1="11.56" y1="4.88" x2="6.44" y2="7.37" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
      <path
        d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 3.375 4.5 8.5 4.5 8.5s4.5-5.125 4.5-8.5A4.5 4.5 0 0 0 8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="8" cy="6" r="1.5" fill="currentColor" />
    </svg>
  );
}

function VoteIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="shrink-0 text-[#D88A24]"
    >
      <rect x="2" y="7" width="12" height="6.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M5.5 5.5h5a1 1 0 0 1 1 1V7h-7v-.5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M6 9.2l1.4 1.4L10.5 7.6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4.5 2.5h2l1 3-1.6 1.1a7.2 7.2 0 0 0 3.5 3.5L10.5 8l3 1v2a1.5 1.5 0 0 1-1.5 1.5C6.2 12.5 3.5 9.8 3.5 6A1.5 1.5 0 0 1 4.5 2.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
