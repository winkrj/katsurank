import { useState } from 'react'
import type { RestaurantDetail } from '../types/restaurantDetail'
import { ShopExtraInfoSection } from './ShopExtraInfoSection'
import { ShopMenuSection } from './ShopMenuSection'

type ShopDetailTabsProps = {
  restaurant: RestaurantDetail
  layout?: 'desktop' | 'mobile'
}

type TabId = 'info' | 'reviews'

export function ShopDetailTabs({ restaurant, layout = 'desktop' }: ShopDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('info')
  const isMobile = layout === 'mobile'

  return (
    <section>
      <div className="flex border-b border-[#E8D9BF]">
        <TabButton
          active={activeTab === 'info'}
          onClick={() => setActiveTab('info')}
          label="상세 정보"
        />
        <TabButton
          active={activeTab === 'reviews'}
          onClick={() => setActiveTab('reviews')}
          label={`리뷰 ${restaurant.reviewCount}`}
        />
      </div>

      <div className={isMobile ? 'pt-6' : 'grid grid-cols-2 gap-10 pt-8'}>
        {activeTab === 'info' ? (
          isMobile ? (
            <div className="space-y-8">
              <ShopMenuSection menuItems={restaurant.menuItems} />
              <ShopExtraInfoSection restaurant={restaurant} />
            </div>
          ) : (
            <>
              <ShopMenuSection menuItems={restaurant.menuItems} />
              <ShopExtraInfoSection restaurant={restaurant} />
            </>
          )
        ) : (
          <div className={isMobile ? '' : 'col-span-2'}>
            <p className="py-10 text-center text-[14px] text-[#8A7A6A]">
              리뷰 기능은 준비 중입니다.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative px-5 py-3 text-[15px] font-bold transition',
        active ? 'text-[#2A1A12]' : 'text-[#8A7A6A] hover:text-[#5F4A3C]',
      ].join(' ')}
    >
      {label}
      {active && (
        <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-[#2A1A12]" />
      )}
    </button>
  )
}
