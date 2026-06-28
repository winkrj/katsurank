type SearchBannerProps = {
  layout: 'desktop' | 'mobile';
};

export function SearchBanner({ layout }: SearchBannerProps) {
  const isMobile = layout === 'mobile';
  const src = isMobile ? '/images/search_banner_mobile.png' : '/images/search_banner_desktop.png';

  return (
    <div className={isMobile ? 'w-full' : 'w-full border-b border-[#E8D9BF]/60'}>
      <img
        src={src}
        alt="돈까스집 검색 — 가게명 또는 지역으로 검색해 보세요"
        className={isMobile ? 'w-full object-cover' : 'h-[200px] w-full'}
      />
    </div>
  );
}
