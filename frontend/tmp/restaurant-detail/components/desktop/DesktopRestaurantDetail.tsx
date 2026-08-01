import type { RestaurantDetail } from '../../types/restaurantDetail';
import { ShopDetailTabs } from '../ShopDetailTabs';
import { ShopImageGallery } from './ShopImageGallery';
import { ShopInfoSection } from './ShopInfoSection';

type DesktopRestaurantDetailProps = {
  restaurant: RestaurantDetail;
};

export function DesktopRestaurantDetail({ restaurant }: DesktopRestaurantDetailProps) {
  return (
    <main className="bg-[#FFFDF4] pt-20 text-[#2A1A12]">
      <div className="mx-auto max-w-[1200px] px-8 py-10">
        {/* TODO: 2차 -> 투표 패널 추가 시 주석 해제 */}
        {/* <div className="grid grid-cols-[minmax(280px,360px)_minmax(300px,1fr)_minmax(260px,300px)] gap-8"> */}
        <div className="grid grid-cols-[minmax(280px,360px)_minmax(300px,1fr)] gap-8">
          <ShopImageGallery images={restaurant.images} name={restaurant.name} />
          <ShopInfoSection restaurant={restaurant} />
          {/* TODO: 2차 */}
          {/* <ShopVotePanel restaurant={restaurant} /> */}
        </div>

        <hr className="my-10 border-[#E8D9BF]" />

        <ShopDetailTabs restaurant={restaurant} />
      </div>
    </main>
  );
}
