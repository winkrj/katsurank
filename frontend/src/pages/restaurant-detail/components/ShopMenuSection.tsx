import type { MenuItem } from '../types/restaurantDetail'

type ShopMenuSectionProps = {
  menuItems: MenuItem[]
}

export function ShopMenuSection({ menuItems }: ShopMenuSectionProps) {
  return (
    <section>
      <h2 className="mb-4 text-[16px] font-black text-[#2A1A12]">대표 메뉴</h2>
      <ul className="space-y-3">
        {menuItems.map((item) => (
          <li
            key={item.name}
            className="flex items-center justify-between border-b border-[#F0E3CC] pb-3 last:border-b-0"
          >
            <span className="text-[15px] font-semibold text-[#2A1A12]">{item.name}</span>
            <span className="text-[14px] font-bold text-[#5F4A3C]">
              {item.price.toLocaleString()}원
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
