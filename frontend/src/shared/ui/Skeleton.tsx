type SkeletonProps = {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={['animate-pulse rounded-md bg-[#EDE0CB]', className].join(' ')}
      aria-hidden
    />
  )
}
