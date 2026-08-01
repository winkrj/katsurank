type SearchBannerProps = {
  layout: 'desktop' | 'mobile';
};

export function SearchBanner({ layout }: SearchBannerProps) {
  const isMobile = layout === 'mobile';
  const src = isMobile ? '/images/search_banner_mobile.png' : '/images/search_banner_desktop.jpeg';

  return (
    <div
      className={[
        'relative w-full overflow-hidden',
        isMobile ? 'aspect-[1778/494]' : 'aspect-[2108/210] border-b border-[#E8D9BF]/60',
      ].join(' ')}
    >
      <img
        src={src}
        alt="돈까스집 검색 — 가게명으로 검색해 보세요"
        className="absolute inset-0 size-full object-cover object-center"
      />
    </div>
  );
}
