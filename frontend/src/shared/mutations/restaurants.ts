import { useMutation, useQueryClient } from '@tanstack/react-query'
import { registerRestaurant, closeRestaurant, relocateRestaurant } from '../api/restaurants'
import type { RestaurantRegisterRequest, RelocateRequest } from '../types/restaurant'
import { queryKeys } from '../queries/queryKeys'

export function useRegisterRestaurantMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: RestaurantRegisterRequest) => registerRestaurant(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all })
    },
  })
}

export function useCloseRestaurantMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => closeRestaurant(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.restaurants.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all })
    },
  })
}

export function useRelocateRestaurantMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: RelocateRequest }) =>
      relocateRestaurant(id, body),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.restaurants.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all })
    },
  })
}
