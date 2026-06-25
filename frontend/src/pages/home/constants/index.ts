import type { RankingItem } from '../../../shared/types/ranking'

export const MOCK_RANKINGS: RankingItem[] = [
  { id: 1, rank: 1, name: '정돈 강남점', votes: 1248 },
  { id: 2, rank: 2, name: '카츠바이콘반', votes: 982 },
  { id: 3, rank: 3, name: '오제제', votes: 671 },
  { id: 4, rank: 4, name: '부타카츠', votes: 548 },
  { id: 5, rank: 5, name: '돈카츠인정', votes: 432 },
]

export const MAP_PIN_POSITIONS = [
  { rank: 1, className: 'left-[63%] top-[45%]' },
  { rank: 2, className: 'left-[55%] top-[37%]' },
  { rank: 3, className: 'left-[59%] top-[56%]' },
  { rank: 4, className: 'left-[70%] top-[31%]' },
  { rank: 5, className: 'left-[75%] top-[45%]' },
] as const
