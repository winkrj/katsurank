import { Link } from 'react-router-dom';
import { RESTAURANT_IMAGE_TOTAL_COUNT } from '../constants';

type ShopMobileHeroProps = {
  image: string;
  name: string;
  currentIndex?: number;
};

export function ShopMobileHero({ image, name, currentIndex = 1 }: ShopMobileHeroProps) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#E8D9BF]">
      <img src={image} alt={`${name} 대표 사진`} className="size-full object-cover" />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-3">
        <Link
          to="/"
          className="flex size-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
          aria-label="뒤로 가기"
        >
          <BackIcon />
        </Link>

        <div className="flex gap-2">
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
            aria-label="찜하기"
          >
            <HeartIcon />
          </button>
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
            aria-label="공유하기"
          >
            <ShareIcon />
          </button>
        </div>
      </div>

      <div className="absolute bottom-3 right-4 rounded-full bg-black/45 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur-sm">
        {currentIndex}/{RESTAURANT_IMAGE_TOTAL_COUNT}
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M11 4 6 9l5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M9 15s-5.5-3.6-5.5-7.2a3.2 3.2 0 0 1 5.5-2.2 3.2 3.2 0 0 1 5.5 2.2C14.5 11.4 9 15 9 15Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="13.5" cy="3.75" r="2.25"></circle>
      <circle cx="4.5" cy="9" r="2.25"></circle>
      <circle cx="13.5" cy="14.25" r="2.25"></circle>
      <line x1="6.44" y1="10.13" x2="11.57" y2="12.62"></line>
      <line x1="11.56" y1="4.88" x2="6.44" y2="7.37"></line>
    </svg>
  );
}
