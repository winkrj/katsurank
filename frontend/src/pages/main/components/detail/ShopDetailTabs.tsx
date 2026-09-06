import { useRestaurantRankingHistoryQuery } from '../../../../shared/queries/ranking';
import { CommentSection } from './CommentSection';
import { RankTrendChart } from './RankTrendChart';

type ShopDetailTabsProps = {
  restaurantId: number;
  isActive: boolean;
  layout?: 'desktop' | 'mobile';
};

export function ShopDetailTabs({ restaurantId, isActive, layout = 'desktop' }: ShopDetailTabsProps) {
  const isMobile = layout === 'mobile';
  const { data: rankingHistory, isPending: isHistoryPending } =
    useRestaurantRankingHistoryQuery(restaurantId);

  return (
    <section className="space-y-8">
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
          <p className="py-8 text-center text-[12px] text-[#8A7A6A]">아직 순위 데이터가 없어요.</p>
        ) : (
          <RankTrendChart data={rankingHistory} />
        )}
      </div>

      <div>
        <div className="flex border-b border-[#E8D9BF]">
          <TabButton label="댓글" />
        </div>

        <div className={isMobile ? 'pt-6' : 'grid grid-cols-2 gap-10 pt-8'}>
          <div className={isMobile ? '' : 'col-span-2'}>
            <CommentSection restaurantId={restaurantId} isActive={isActive} showHeader={false} />
          </div>
        </div>
      </div>
    </section>
  );
}

function TabButton({ label }: { label: string }) {
  return (
    <button type="button" className="relative px-5 py-3 text-[15px] font-bold text-[#2A1A12]">
      {label}
      <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-[#2A1A12]" />
    </button>
  );
}
