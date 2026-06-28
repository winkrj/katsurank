export type SearchResultItem = {
  id: number
  rank: number
  name: string
  address: string
  category: string
  votes: number
  image: string
}

export type SearchSortOption = 'rank' | 'votes' | 'name'
