import { useEffect, useRef, useState } from 'react';

type ShopMobileHeroProps = {
  images: string[];
  name: string;
  onClose: () => void;
  onShare: () => void;
};

export function ShopMobileHero({ images: rawImages, name, onClose, onShare }: ShopMobileHeroProps) {
  const images = rawImages ?? [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const slides = container.querySelectorAll<HTMLElement>('[data-slide]');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setCurrentIndex(Number((entry.target as HTMLElement).dataset.slide));
          }
        }
      },
      { root: container, threshold: 0.5 },
    );

    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [images]);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#E8D9BF]">
      <div
        ref={scrollRef}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {images.map((src, i) => (
          <div key={src} data-slide={i} className="h-full w-full shrink-0 snap-center">
            <img src={src} alt={`${name} 사진 ${i + 1}`} className="size-full object-cover" />
          </div>
        ))}
      </div>

      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-3">
        <button
          type="button"
          onClick={onClose}
          className="flex size-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
          aria-label="닫기"
        >
          <BackIcon />
        </button>

        <button
          type="button"
          onClick={onShare}
          className="flex size-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
          aria-label="공유하기"
        >
          <ShareIcon />
        </button>
      </div>

      {images.length > 1 && (
        <>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
            {images.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-200 ${
                  i === currentIndex ? 'h-1.5 w-3.5 bg-white' : 'h-1.5 w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>

          <div className="absolute bottom-3 right-4 rounded-full bg-black/45 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur-sm">
            {currentIndex + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M11 4 6 9l5 5"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 18 18"
      fill="none"
      stroke="#fff"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="13.5" cy="3.75" r="2.25" />
      <circle cx="4.5" cy="9" r="2.25" />
      <circle cx="13.5" cy="14.25" r="2.25" />
      <line x1="6.44" y1="10.13" x2="11.57" y2="12.62" />
      <line x1="11.56" y1="4.88" x2="6.44" y2="7.37" />
    </svg>
  );
}
