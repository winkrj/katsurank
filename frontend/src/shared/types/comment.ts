export type CommentAuthor = {
  id: number
  nickname: string
  profileImage: string | null
}

export type CommentResponse = {
  id: number
  restaurantId: number
  content: string
  author: CommentAuthor
  createdAt: string
  updatedAt: string
}

export type CommentRequest = {
  content: string
}
