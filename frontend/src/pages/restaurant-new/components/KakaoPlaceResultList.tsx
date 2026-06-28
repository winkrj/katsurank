import { Link } from 'react-router-dom'
import type { KakaoPlace } from '../types/registerFlow'

type KakaoPlaceResultListProps = {
  places: KakaoPlace[]
  onSelect: (place: KakaoPlace) => void
}

export function KakaoPlaceResultList({ places, onSelect }: KakaoPlaceResultListProps) {
  if (places.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#E8D9BF] bg-[#FFFDF4] px-4 py-10 text-center">
        <p className="text-[15px] font-black text-[#2A1A12]">검색 결과가 없어요!</p>
        <p className="mt-2 text-[13px] leading-relaxed text-[#8A7A6A]">
          다른 키워드로 검색하거나
          <br />
          아래에서 새 가게를 등록해 보세요.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {places.map((place) => (
        <li key={place.kakaoPlaceId}>
          <div className="rounded-xl border border-[#E8D9BF] bg-[#FFFDF4] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-black text-[#2A1A12]">{place.name}</p>
                <p className="mt-1 text-[12px] leading-snug text-[#8A7A6A]">{place.roadAddress}</p>
                {place.isRegistered && (
                  <p className="mt-1 text-[12px] font-bold text-[#D88A24]">(이미 등록된 가게)</p>
                )}
              </div>

              {place.isRegistered && place.registeredRestaurantId ? (
                <Link
                  to={`/restaurants/${place.registeredRestaurantId}`}
                  className="shrink-0 rounded-lg border border-[#E8D9BF] bg-white px-3 py-2 text-[12px] font-bold text-[#2A1A12] hover:border-[#D88A24]"
                >
                  바로 보기
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelect(place)}
                  className="shrink-0 rounded-lg border-2 border-[#DBBA24] bg-[#FFC533] px-3 py-2 text-[12px] font-bold text-[#2A1A12]"
                >
                  선택
                </button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
