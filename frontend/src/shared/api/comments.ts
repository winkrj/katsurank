import { apiClient } from './client'
import type { CommentRequest, CommentResponse } from '../types/comment'
import type { Paginated } from '../types/common'

export function fetchComments(restaurantId: number, limit = 20, offset = 0) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  return apiClient<Paginated<CommentResponse>>(
    `/api/v1/restaurants/${restaurantId}/comments?${params}`,
  )
}

export function createComment(restaurantId: number, body: CommentRequest) {
  return apiClient<CommentResponse>(`/api/v1/restaurants/${restaurantId}/comments`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateComment(restaurantId: number, commentId: number, body: CommentRequest) {
  return apiClient<CommentResponse>(`/api/v1/restaurants/${restaurantId}/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deleteComment(restaurantId: number, commentId: number) {
  return apiClient<void>(`/api/v1/restaurants/${restaurantId}/comments/${commentId}`, {
    method: 'DELETE',
  })
}
