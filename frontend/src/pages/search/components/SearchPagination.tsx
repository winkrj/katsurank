import type { ReactNode } from 'react'

type SearchPaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function SearchPagination({
  currentPage,
  totalPages,
  onPageChange,
}: SearchPaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="검색 결과 페이지">
      <PaginationButton
        label="이전"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ‹
      </PaginationButton>

      {pages.map((page) => (
        <PaginationButton
          key={page}
          label={`${page}페이지`}
          active={page === currentPage}
          onClick={() => onPageChange(page)}
        >
          {page}
        </PaginationButton>
      ))}

      <PaginationButton
        label="다음"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        ›
      </PaginationButton>
    </nav>
  )
}

function PaginationButton({
  children,
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  children: ReactNode
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      disabled={disabled}
      onClick={onClick}
      className={[
        'flex size-9 items-center justify-center rounded-lg text-[14px] font-bold transition',
        active
          ? 'border-2 border-[#DBBA24] bg-[#FFC533] text-[#2A1A12]'
          : 'border border-[#E8D9BF] bg-white text-[#5F4A3C] hover:border-[#D88A24] disabled:cursor-not-allowed disabled:opacity-40',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
