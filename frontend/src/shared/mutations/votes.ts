import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createVote } from '../api/votes'
import type { VoteRequest } from '../types/vote'
import { queryKeys } from '../queries/queryKeys'

export function useCreateVoteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: VoteRequest) => createVote(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.me.all })
    },
  })
}
