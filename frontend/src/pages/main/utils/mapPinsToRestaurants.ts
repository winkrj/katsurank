import type { MapPinResponse } from '../../../shared/types/ranking'
import type { MapRestaurant } from '../types/map'

// MapPinResponse엔 rank가 없음 — 백엔드 랭킹과 동일 기준(vote_count DESC)으로 클라이언트에서 매김
export function mapPinsToRestaurants(pins: MapPinResponse[]): MapRestaurant[] {
  return [...pins]
    .sort((a, b) => b.voteCount - a.voteCount)
    .map((pin, index) => ({
      id: pin.id,
      rank: index + 1,
      name: pin.name,
      address: '',
      shortAddress: '',
      votes: pin.voteCount,
      weeklyVoteDelta: 0,
      lat: pin.latitude,
      lng: pin.longitude,
      hours: '',
      breakTime: '',
      tags: [],
      isOpen: true,
      image: '/images/shop_default_img.png',
    }))
}
