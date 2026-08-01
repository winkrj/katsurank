import type { RestaurantDetail } from '../types/restaurantDetail';

type ShopDetailTabsProps = {
  restaurant: RestaurantDetail;
  layout?: 'desktop' | 'mobile';
};

// TODO: 2차 -> 상세 정보 탭(ShopExtraInfoSection) + 리뷰 개수 붙일 때 restaurant 다시 사용
export function ShopDetailTabs({ layout = 'desktop' }: ShopDetailTabsProps) {
  const isMobile = layout === 'mobile';

  return (
    <section>
      <div className="flex border-b border-[#E8D9BF]">
        <TabButton label={`리뷰`} />
        {/* TODO: 2차 */}
        {/* <TabButton label={`리뷰 ${restaurant.reviewCount}`} /> */}
      </div>

      <div className={isMobile ? 'pt-6' : 'grid grid-cols-2 gap-10 pt-8'}>
        <div className={isMobile ? '' : 'col-span-2'}>
          <p className="py-10 text-center text-[14px] text-[#8A7A6A]">리뷰 기능은 준비 중입니다.</p>
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
