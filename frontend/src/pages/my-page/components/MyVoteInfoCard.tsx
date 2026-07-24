const INFO_ITEMS = [
  { icon: <PersonIcon />, label: '1인 1표 참여 가능' },
  { icon: <RefreshIcon />, label: '표 변경은 자유롭게' },
  { icon: <ShieldIcon />, label: '공정한 랭킹을 위해 운영 정책을 따릅니다.' },
] as const;

type MyVoteInfoCardProps = {
  layout: 'desktop' | 'mobile';
};

export function MyVoteInfoCard({ layout }: MyVoteInfoCardProps) {
  const isDesktop = layout === 'desktop';

  return (
    <div className="rounded-2xl border border-[#E8D9BF] bg-white p-6 shadow-[0_4px_16px_rgba(42,26,18,0.06)]">
      {isDesktop ? (
        <>
          <div className="mb-4 flex flex-col items-center gap-2 text-center">
            <CalendarCheckIcon />
            <h3 className="text-[16px] font-black text-[#2A1A12]">표 변경 안내</h3>
            <p className="text-[13px] leading-relaxed text-[#5F4A3C]">
              내 표는 언제든 변경할 수 있어요.
              <br />
              새로운 가게를 찾아 응원해 주세요!
            </p>
          </div>
          <ul className="mt-4 space-y-3">
            {INFO_ITEMS.map(({ icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-[13px] text-[#5F4A3C]">
                <span className="shrink-0 text-[#8A7A6A]">{icon}</span>
                {label}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <h3 className="mb-1 text-[14px] font-black text-[#2A1A12]">표 변경 안내</h3>
          <p className="mb-4 text-[12px] text-[#5F4A3C]">
            내 표는 언제든 변경할 수 있어요.
            <br />
            새로운 가게를 찾아 응원해 주세요!
          </p>
          <ul className="space-y-2.5">
            {INFO_ITEMS.map(({ icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-[12px] leading-snug text-[#5F4A3C]"
              >
                <span className="shrink-0 text-[#8A7A6A]">{icon}</span>
                {label}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function CalendarCheckIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden>
      <rect
        x="4"
        y="8"
        width="28"
        height="24"
        rx="3"
        stroke="#D88A24"
        strokeWidth="2"
        fill="#FFF4D0"
      />
      <path d="M4 15h28" stroke="#D88A24" strokeWidth="2" />
      <path d="M12 4v6M24 4v6" stroke="#D88A24" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M12 23l4 4 8-8"
        stroke="#D88A24"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
      className="block"
    >
      <circle cx="8" cy="5" r="3" />
      <path d="M2 14c.6-3 2.6-4.5 6-4.5s5.4 1.5 6 4.5" strokeLinecap="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
      className="block"
    >
      <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5" strokeLinecap="round" />
      <path d="M8 1v3.5H4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
      className="block"
    >
      <path d="M8 2L3 4.5v4C3 11.5 5.5 14 8 15c2.5-1 5-3.5 5-6.5v-4L8 2z" strokeLinejoin="round" />
    </svg>
  );
}
