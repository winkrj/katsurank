import type { SearchResultItem } from '../types/searchResult'
import { SearchEmptyState } from './SearchEmptyState'
import { SearchResultCard } from './SearchResultCard'

type SearchResultListProps = {
  items: SearchResultItem[]
  layout?: 'desktop' | 'mobile'
  hasQuery?: boolean
}

export function SearchResultList({
  items,
  layout = 'desktop',
  hasQuery = false,
}: SearchResultListProps) {
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
