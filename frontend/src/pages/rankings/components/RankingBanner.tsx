type RankingBannerProps = {
  layout: 'desktop' | 'mobile';
};

export function RankingBanner({ layout }: RankingBannerProps) {
  const isDesktop = layout === 'desktop';

  return (
    <div
      className={[
        'relative overflow-hidden',
        isDesktop ? 'w-full aspect-[4096/890] max-h-[220px]' : 'w-full aspect-[1505/516]',
      ].join(' ')}
    >
      <img
        src={`/images/ranking_banner_${layout}.png`}
        alt="돈까스 랭킹 배너"
        aria-hidden
        className="absolute inset-0 size-full object-cover object-center"
      />
    </div>
  );
}
