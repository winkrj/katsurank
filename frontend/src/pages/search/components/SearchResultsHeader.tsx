import { MOCK_SEARCH_TOTAL_COUNT } from '../constants';
import type { SearchSortOption } from '../types/searchResult';

type SearchResultsHeaderProps = {
  total?: number;
  sort: SearchSortOption;
  onSortChange: (sort: SearchSortOption) => void;
};

export function SearchResultsHeader({
  total = MOCK_SEARCH_TOTAL_COUNT,
}: SearchResultsHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-[18px] font-black text-[#2A1A12]">검색 결과</h2>
        <p className="mt-1 text-[13px] text-[#8A7A6A]">총 {total}개의 검색 결과</p>
      </div>

      {/* TODO: 2차 */}
      {/* <label className="flex items-center gap-2 text-[13px] font-semibold text-[#5F4A3C]">
        <span className="sr-only">정렬</span>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SearchSortOption)}
          className="h-9 rounded-lg border border-[#E8D9BF] bg-white px-3 text-[13px] font-bold text-[#2A1A12] outline-none focus:border-[#D88A24]"
        >
          {SEARCH_SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label> */}
    </div>
  );
}
