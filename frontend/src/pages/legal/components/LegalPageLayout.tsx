import type { ReactNode } from 'react';

type LegalPageLayoutProps = {
  title: string;
  effectiveDate: string;
  children: ReactNode;
};

export function LegalPageLayout({ title, effectiveDate, children }: LegalPageLayoutProps) {
  return (
    <main className="min-h-screen bg-[#FFFDF4] px-5 pb-16 pt-20 text-[#2A1A12] sm:px-8">
      <div className="mx-auto max-w-[720px]">
        <h1 className="text-[24px] font-black">{title}</h1>
        <p className="mt-1 text-[13px] text-[#8A7A6A]">시행일자: {effectiveDate}</p>

        <div className="mt-8 space-y-8 text-[14px] leading-relaxed [&_h2]:mb-2 [&_h2]:text-[16px] [&_h2]:font-black [&_h2]:text-[#2A1A12] [&_p]:text-[#5F4A3C] [&_li]:text-[#5F4A3C] [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>
      </div>
    </main>
  );
}
