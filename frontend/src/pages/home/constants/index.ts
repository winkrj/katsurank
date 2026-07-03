import type { RankingItem } from '../../../shared/types/ranking'

export const MOCK_RANKINGS: RankingItem[] = [
  { rank: 1, restaurantId: 1, restaurantName: '정돈 강남점', voteCount: 1248 },
  { rank: 2, restaurantId: 2, restaurantName: '카츠바이콘반', voteCount: 982 },
  { rank: 3, restaurantId: 3, restaurantName: '오제제', voteCount: 671 },
  { rank: 4, restaurantId: 4, restaurantName: '부타카츠', voteCount: 548 },
  { rank: 5, restaurantId: 5, restaurantName: '돈카츠인정', voteCount: 432 },
  { rank: 6, restaurantId: 6, restaurantName: '카츠오우', voteCount: 398 },
  { rank: 7, restaurantId: 7, restaurantName: '토나리', voteCount: 356 },
  { rank: 8, restaurantId: 8, restaurantName: '카츠쿠라', voteCount: 312 },
  { rank: 9, restaurantId: 9, restaurantName: '돈까스클럽', voteCount: 287 },
  { rank: 10, restaurantId: 10, restaurantName: '카츠야', voteCount: 251 },
]

export const MAP_PIN_POSITIONS = [
  { rank: 1, className: 'left-[63%] top-[45%]' },
  { rank: 2, className: 'left-[55%] top-[37%]' },
  { rank: 3, className: 'left-[59%] top-[56%]' },
  { rank: 4, className: 'left-[70%] top-[31%]' },
  { rank: 5, className: 'left-[75%] top-[45%]' },
] as const
