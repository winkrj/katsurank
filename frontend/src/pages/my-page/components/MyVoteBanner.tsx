type MyVoteBannerProps = {
  layout: 'desktop' | 'mobile';
};

export function MyVoteBanner({ layout }: MyVoteBannerProps) {
  const isDesktop = layout === 'desktop';

  return (
    <div className={['relative overflow-hidden', isDesktop ? 'h-[180px]' : 'h-[120px]'].join(' ')}>
      <img
        src={isDesktop ? '/images/my_vote_banner_desktop.png' : '/images/my_vote_banner_mobile.png'}
        alt="나의 한 표 배너"
        aria-hidden
        className="absolute inset-0 size-full object-cover object-center"
      />
    </div>
  );
}
