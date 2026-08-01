import type { RestaurantDetail } from '../../types/restaurantDetail';
import { ShopDetailTabs } from './ShopDetailTabs';
import { ShopImageGallery } from './desktop/ShopImageGallery';
import { ShopInfoSection } from './desktop/ShopInfoSection';

type DesktopRestaurantDetailContentProps = {
  restaurant: RestaurantDetail;
};

export function DesktopRestaurantDetailContent({ restaurant }: DesktopRestaurantDetailContentProps) {
  return (
    <div className="bg-[#FFFDF4] text-[#2A1A12]">
      <div className="grid grid-cols-[minmax(280px,360px)_minmax(300px,1fr)] gap-8">
        <ShopImageGallery images={restaurant.images} name={restaurant.name} />
        <ShopInfoSection restaurant={restaurant} />
      </div>

      <hr className="my-10 border-[#E8D9BF]" />

      <ShopDetailTabs />
    </div>
  );
}
