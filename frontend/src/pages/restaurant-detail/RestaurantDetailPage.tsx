import { useParams } from 'react-router-dom'
import { PageShell } from '../../shared/ui/PageShell'

export function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <PageShell title="가게 상세">
      <p className="page__placeholder">가게 ID: {id ?? '—'}</p>
    </PageShell>
  )
}
