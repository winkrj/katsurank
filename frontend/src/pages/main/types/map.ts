export type MapRestaurant = {
  id: number
  rank: number
  name: string
  address: string
  shortAddress: string
  votes: number
  weeklyVoteDelta: number
  lat: number
  lng: number
  hours: string
  breakTime: string
  tags: string[]
  isOpen: boolean
  image: string
}
