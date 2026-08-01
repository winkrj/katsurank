import { useQuery } from '@tanstack/react-query';
import { fetchRestaurant } from '../../../shared/api/restaurants';
import { queryKeys } from '../../../shared/queries/queryKeys';
import type { RestaurantResponse } from '../../../shared/types/restaurant';
import type { RestaurantDetail } from '../types/restaurantDetail';

// 실제 API 응답이 필드를 누락해서 내려주는 경우가 있어서, 화면이 그걸로 안 죽게 전부 안전한 기본값을 깐다.
function mapToDetail(r: RestaurantResponse): RestaurantDetail {
  const isClosed = r.status === 'CLOSED';
  const voteCount = r.voteCount ?? 0;

  return {
    id: r.id,
    status: r.status,
    name: r.name ?? '',
    rank: r.rank ?? 0,
    rankAreaLabel: r.rank ? `서울 ${r.rank}위` : '',
    rankBadgeLabel: r.rank ? `전체 ${r.rank}위` : '',
    tagline: isClosed ? '폐업으로 랭킹과 투표에서 제외된 가게입니다' : ``,
    totalVotes: voteCount,
    images: [
      '/images/shop_default_img.png',
      '/images/shop_default_img.png',
      '/images/shop_default_img.png',
      '/images/shop_default_img.png',
    ],
    address: r.address ?? '',
    shortAddress: r.address ?? '',
    distance: '',
    hours: isClosed ? '폐업' : '영업 정보 준비 중',
    breakTime: isClosed ? '더 이상 영업하지 않는 가게예요' : '',
    phone: '02-123-4567',
    kakaoMapUrl: r.kakaoPlaceId ? `https://place.map.kakao.com/${r.kakaoPlaceId}` : '',
    closedDays: isClosed ? '폐업' : '',
    parking: '',
    reservation: '',
    reviewCount: 0,
  };
}

export function useRestaurantDetailQuery(id: number | null) {
  return useQuery({
    queryKey: queryKeys.restaurants.detail(id ?? 0),
    queryFn: () => fetchRestaurant(id as number).then(mapToDetail),
    enabled: id != null && id > 0,
  });
}
