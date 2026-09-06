import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createComment, deleteComment, updateComment } from '../api/comments'
import type { CommentRequest } from '../types/comment'
import { queryKeys } from '../queries/queryKeys'

export function useCreateCommentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ restaurantId, body }: { restaurantId: number; body: CommentRequest }) =>
      createComment(restaurantId, body),
    onSuccess: (_data, { restaurantId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.list(restaurantId) })
    },
  })
}

export function useUpdateCommentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      restaurantId,
      commentId,
      body,
    }: {
      restaurantId: number
      commentId: number
      body: CommentRequest
    }) => updateComment(restaurantId, commentId, body),
    onSuccess: (_data, { restaurantId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.list(restaurantId) })
    },
  })
}

export function useDeleteCommentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ restaurantId, commentId }: { restaurantId: number; commentId: number }) =>
      deleteComment(restaurantId, commentId),
    onSuccess: (_data, { restaurantId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.list(restaurantId) })
    },
  })
}
