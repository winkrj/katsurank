export type Restaurant = {
  id: number
  name: string
  address: string
  voteCount: number
}

export type RestaurantListParams = {
  bounds?: string
  sort?: string
}
