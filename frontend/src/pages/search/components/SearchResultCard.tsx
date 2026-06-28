import { RankBadge } from '../../home/components/RankBadge';
import { Button } from '../../../shared/ui/Button';
import { RestaurantVoteConfirmButton } from '../../restaurant-detail/components/RestaurantVoteConfirmButton';
import type { SearchResultItem } from '../types/searchResult';

type SearchResultCardProps = {
  item: SearchResultItem;
  layout?: 'desktop' | 'mobile';
};

export function SearchResultCard({ item, layout = 'desktop' }: SearchResultCardProps) {
  const isMobile = layout === 'mobile';

  return (
    <article
      className={
        isMobile
          ? 'flex gap-3 rounded-2xl border border-[#E8D9BF] bg-white p-3 shadow-[0_8px_20px_rgba(58,35,24,0.05)]'
          : 'flex gap-4 rounded-2xl border border-[#E8D9BF] bg-white p-4 shadow-[0_8px_24px_rgba(58,35,24,0.06)]'
      }
    >
      <div
        className={
          isMobile
            ? 'size-[88px] shrink-0 overflow-hidden rounded-xl border border-[#E8D9BF]'
            : 'size-[120px] shrink-0 overflow-hidden rounded-xl border border-[#E8D9BF]'
        }
      >
        <img src={item.image} alt="" className="size-full object-cover" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-1 flex items-center gap-2">
          <RankBadge
            rank={item.rank}
            className={isMobile ? 'size-[20px] text-[11px]' : undefined}
          />
          <h3 className="truncate text-[15px] font-black text-[#2A1A12]">{item.name}</h3>
        </div>

        <p className="mb-1 flex items-start gap-1 text-[12px] leading-snug text-[#8A7A6A]">
          <LocationIcon />
          <span className="line-clamp-2">{item.address}</span>
        </p>

        <p className="mb-3 text-[14px] font-bold text-[#D88A24]">{item.votes.toLocaleString()}표</p>

        <div className={`mt-auto flex gap-2 ${isMobile ? '' : 'justify-end'}`}>
          <Button
            tag="a"
            variant="secondary"
            href={`/restaurants/${item.id}`}
            className={
              isMobile
                ? 'h-10 flex-1 rounded-lg text-[13px]'
                : 'h-10 min-w-[100px] rounded-lg text-[13px]'
            }
          >
            상세보기
          </Button>
          <RestaurantVoteConfirmButton
            restaurantName={item.name}
            label="투표하기"
            className={
              isMobile
                ? 'h-10 flex-1 rounded-lg text-[13px]'
                : 'h-10 min-w-[100px] rounded-lg text-[13px]'
            }
          />
        </div>
      </div>
    </article>
  );
}

function LocationIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="mt-0.5 shrink-0"
    >
      <path
        d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 3.375 4.5 8.5 4.5 8.5s4.5-5.125 4.5-8.5A4.5 4.5 0 0 0 8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="8" cy="6" r="1.5" fill="currentColor" />
    </svg>
  );
}
