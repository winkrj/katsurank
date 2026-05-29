type RestaurantSearchInputProps = {
  onSearch: (query: string) => void
}

/** 가게 추가·이름 검색 공용 */
export function RestaurantSearchInput({ onSearch }: RestaurantSearchInputProps) {
  return (
    <input
      type="search"
      placeholder="가게 이름 검색"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onSearch((e.target as HTMLInputElement).value)
        }
      }}
    />
  )
}
