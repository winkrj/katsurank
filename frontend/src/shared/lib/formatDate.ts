const KST_OFFSET_MS = 9 * 60 * 60 * 1000

/** UTC로 저장된 시각을 표시 시점에 KST 기준 YYYY-MM-DD로 변환한다. */
export function formatDateKST(iso: string): string {
  const kst = new Date(new Date(iso).getTime() + KST_OFFSET_MS)
  const y = kst.getUTCFullYear()
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0')
  const d = String(kst.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
