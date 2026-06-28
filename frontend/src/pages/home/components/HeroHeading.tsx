type HeroHeadingProps = {
  variant: 'desktop' | 'mobile';
};

export function HeroHeading({ variant }: HeroHeadingProps) {
  if (variant === 'mobile') {
    return (
      <>
        <p className="mobile-hero__subtitle">당신의 인생 돈까스 한 집.</p>
        <h1 className="mobile-hero__title">
          서울 돈까스 랭킹
          <br />
          TOP 10
        </h1>
      </>
    );
  }

  return (
    <>
      <p className="mb-2 text-[25px] font-bold">당신의 인생 돈까스</p>
      <h1 className="mb-7 text-[3rem] font-bold leading-[1.3] tracking-[0.001em]">
        서울 돈까스 랭킹
        <br />
        TOP 5
      </h1>
    </>
  );
}
