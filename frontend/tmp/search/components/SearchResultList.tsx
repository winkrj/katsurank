import { Skeleton } from '../../../shared/ui/Skeleton'
import type { SearchResultItem } from '../types/searchResult'
import { SearchEmptyState } from './SearchEmptyState'
import { SearchResultCard } from './SearchResultCard'

type SearchResultListProps = {
  items: SearchResultItem[]
  layout?: 'desktop' | 'mobile'
  hasQuery?: boolean
  isLoading?: boolean
}

export function SearchResultList({
  items,
  layout = 'desktop',
  hasQuery = false,
  isLoading = false,
}: SearchResultListProps) {
  if (isLoading) {
    return (
      <ul className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i}>
            <div className="flex gap-4 rounded-2xl border border-[#E8D9BF] bg-white p-4">
              <Skeleton className={layout === 'mobile' ? 'size-[88px] rounded-xl' : 'size-[120px] rounded-xl'} />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  if (items.length === 0) {
    return <SearchEmptyState hasQuery={hasQuery} />
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.id}>
          <SearchResultCard item={item} layout={layout} />
        </li>
      ))}
    </ul>
  )
}
