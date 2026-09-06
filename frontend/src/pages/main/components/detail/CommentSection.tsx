import { useState } from 'react'
import { ApiError } from '../../../../shared/api/client'
import { KAKAO_LOGIN_URL } from '../../../../shared/constant/api'
import { saveLoginRedirect } from '../../../../shared/lib/loginRedirect'
import {
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useUpdateCommentMutation,
} from '../../../../shared/mutations/comments'
import { useCommentsQuery } from '../../../../shared/queries/comments'
import { useMeQuery } from '../../../../shared/queries/me'
import { useAuthStore } from '../../../../shared/stores/authStore'
import type { CommentResponse } from '../../../../shared/types/comment'
import { Toast } from '../../../../shared/ui/Toast'
import { ConfirmDialog } from '../../../../shared/ui/dialog'

const MAX_LENGTH = 500

type CommentSectionProps = {
  restaurantId: number
  isActive: boolean
  showHeader?: boolean
}

export function CommentSection({ restaurantId, isActive, showHeader = true }: CommentSectionProps) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn())
  const { data: me } = useMeQuery(isLoggedIn)
  const { data, isPending } = useCommentsQuery(restaurantId)
  const comments = data?.items ?? []
  const myComment = me ? comments.find((c) => c.author.id === me.id) : undefined

  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const { mutate: create, isPending: isCreating } = useCreateCommentMutation()
  const { mutate: update, isPending: isUpdating } = useUpdateCommentMutation()
  const { mutate: remove } = useDeleteCommentMutation()

  function handleCreate() {
    const content = draft.trim()
    if (!content) return

    create(
      { restaurantId, body: { content } },
      {
        onSuccess: () => {
          setDraft('')
          setToastMessage('댓글이 등록됐어요')
        },
        onError: (err) => setToastMessage(getCommentErrorMessage(err)),
      },
    )
  }

  function startEdit(comment: CommentResponse) {
    setEditingId(comment.id)
    setEditDraft(comment.content)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditDraft('')
  }

  function handleUpdate(commentId: number) {
    const content = editDraft.trim()
    if (!content) return

    update(
      { restaurantId, commentId, body: { content } },
      {
        onSuccess: () => {
          cancelEdit()
          setToastMessage('댓글이 수정됐어요')
        },
        onError: (err) => setToastMessage(getCommentErrorMessage(err)),
      },
    )
  }

  function handleDelete() {
    if (deleteTarget == null) return
    const commentId = deleteTarget
    setDeleteTarget(null)

    remove(
      { restaurantId, commentId },
      {
        onSuccess: () => setToastMessage('댓글이 삭제됐어요'),
        onError: (err) => setToastMessage(getCommentErrorMessage(err)),
      },
    )
  }

  return (
    <section className="space-y-4">
      {showHeader && (
        <p className="text-[13px] font-black text-[#2A1A12]">
          댓글 ({data?.total ?? comments.length})
        </p>
      )}

      {isLoggedIn && isActive && !myComment && (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
            placeholder="이 가게에 대한 한마디를 남겨보세요 (가게당 댓글 1개)"
            rows={3}
            maxLength={MAX_LENGTH}
            className="w-full resize-none rounded-lg border border-[#E8D9BF] bg-white p-3 text-[13px] text-[#2A1A12] placeholder:text-[#B8A88E] focus:border-[#D88A24] focus:outline-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#B8A88E]">
              {draft.length}/{MAX_LENGTH}
            </span>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!draft.trim() || isCreating}
              className="rounded-lg bg-[#FFC533] px-4 py-1.5 text-[12px] font-bold text-[#2A1A12] transition hover:bg-[#D88A24] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreating ? '등록 중…' : '댓글 등록'}
            </button>
          </div>
        </div>
      )}

      {!isLoggedIn && (
        <a
          href={KAKAO_LOGIN_URL}
          onClick={saveLoginRedirect}
          className="flex h-10 items-center justify-center rounded-lg border border-[#E8D9BF] bg-white text-[12px] font-bold text-[#5F4A3C] transition hover:border-[#D88A24] hover:bg-[#FFF4D8]"
        >
          로그인하고 댓글 남기기
        </a>
      )}

      {isPending ? (
        <p className="py-6 text-center text-[13px] text-[#8A7A6A]">댓글 불러오는 중…</p>
      ) : comments.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-[#8A7A6A]">
          아직 댓글이 없어요. 첫 댓글을 남겨보세요!
        </p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8D9BF] bg-[#FFF4D8] text-[12px] font-black text-[#7A431D]">
                {comment.author.profileImage ? (
                  <img src={comment.author.profileImage} alt="" className="size-full object-cover" />
                ) : (
                  comment.author.nickname.slice(0, 1)
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#2A1A12]">
                  {comment.author.nickname}
                  <span className="text-[11px] font-normal text-[#8A7A6A]">
                    {formatTimeAgo(comment.createdAt)}
                  </span>
                </p>

                {editingId === comment.id ? (
                  <div className="mt-1 space-y-2">
                    <textarea
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value.slice(0, MAX_LENGTH))}
                      rows={3}
                      maxLength={MAX_LENGTH}
                      className="w-full resize-none rounded-lg border border-[#E8D9BF] bg-white p-3 text-[13px] text-[#2A1A12] focus:border-[#D88A24] focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="text-[11px] font-bold text-[#8A7A6A]"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdate(comment.id)}
                        disabled={!editDraft.trim() || isUpdating}
                        className="text-[11px] font-bold text-[#D88A24] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed text-[#5F4A3C]">
                      {comment.content}
                    </p>
                    {me?.id === comment.author.id && (
                      <div className="mt-1 flex gap-2">
                        {isActive && (
                          <button
                            type="button"
                            onClick={() => startEdit(comment)}
                            className="text-[11px] font-bold text-[#8A7A6A] hover:text-[#5F4A3C]"
                          >
                            수정
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(comment.id)}
                          className="text-[11px] font-bold text-[#8A7A6A] hover:text-[#C0392B]"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="댓글을 삭제할까요?"
        description="삭제한 댓글은 되돌릴 수 없어요."
        confirmLabel="삭제"
      />

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </section>
  )
}

function getCommentErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'COMMENT_ALREADY_EXISTS':
        return '이미 이 가게에 댓글을 남겼어요.'
      case 'RESTAURANT_NOT_COMMENTABLE':
        return '지금은 댓글을 작성할 수 없는 가게예요.'
      case 'COMMENT_FORBIDDEN':
        return '본인의 댓글만 수정·삭제할 수 있어요.'
      case 'COMMENT_NOT_FOUND':
        return '댓글을 찾을 수 없어요.'
      default:
        return err.message
    }
  }
  return '잠시 후 다시 시도해 주세요.'
}

function formatTimeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`
  const diffDay = Math.floor(diffHour / 24)
  return `${diffDay}일 전`
}
