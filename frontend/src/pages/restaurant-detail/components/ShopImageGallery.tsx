type ShopImageGalleryProps = {
  images: string[]
  name: string
  layout?: 'desktop' | 'mobile'
}

export function ShopImageGallery({ images, name, layout = 'desktop' }: ShopImageGalleryProps) {
  const [mainImage, ...thumbnails] = images
  const isMobile = layout === 'mobile'

  return (
    <div className={isMobile ? 'space-y-3' : 'space-y-3'}>
      <div
        className={
          isMobile
            ? 'overflow-hidden rounded-2xl border border-[#E8D9BF] bg-white'
            : 'overflow-hidden rounded-2xl border border-[#E8D9BF] bg-white shadow-[0_8px_24px_rgba(58,35,24,0.06)]'
        }
      >
        <img
          src={mainImage}
          alt={`${name} 대표 사진`}
          className={isMobile ? 'aspect-[4/3] w-full object-cover' : 'aspect-[4/3] w-full object-cover'}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {thumbnails.slice(0, 3).map((src, index) => (
          <button
            key={`${src}-${index}`}
            type="button"
            className="overflow-hidden rounded-xl border border-[#E8D9BF] bg-white transition hover:border-[#D88A24]"
          >
            <img
              src={src}
              alt={`${name} 사진 ${index + 2}`}
              className="aspect-square w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
