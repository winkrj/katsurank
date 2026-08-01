type MyVoteBannerProps = {
  layout: 'desktop' | 'mobile';
};

export function MyVoteBanner({ layout }: MyVoteBannerProps) {
  const isDesktop = layout === 'desktop';

  return (
    <div
      className={[
        'relative overflow-hidden',
        isDesktop ? 'w-full aspect-[1953/408] max-h-[250px]' : 'w-full aspect-[1637/657]',
      ].join(' ')}
    >
      <img
        src={isDesktop ? '/images/my_vote_banner_desktop.png' : '/images/my_vote_banner_mobile.png'}
        alt="나의 한 표 배너"
        aria-hidden
        className={['absolute inset-0 size-full object-cover object-center'].join(' ')}
      />
    </div>
  );
}
