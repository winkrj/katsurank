import type { ReactNode } from 'react';
import { RegisterStepper } from './RegisterStepper';
import type { RegisterStep } from '../types/registerFlow';

type RegisterLayoutProps = {
  currentStep: RegisterStep;
  children: ReactNode;
  layout?: 'desktop' | 'mobile';
};

export function RegisterLayout({ currentStep, children, layout = 'desktop' }: RegisterLayoutProps) {
  const isMobile = layout === 'mobile';

  return (
    <div className={isMobile ? 'px-4 py-5' : 'py-8'}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-[22px] font-black text-[#2A1A12] sm:text-[26px]">새 가게 등록하기</h1>
      </div>

      <RegisterStepper currentStep={currentStep} />

      <div
        className={
          isMobile
            ? ''
            : 'mx-auto max-w-[720px] rounded-2xl border border-[#E8D9BF] bg-white p-8 shadow-[0_8px_24px_rgba(58,35,24,0.06)]'
        }
      >
        {isMobile && (
          <div className="mb-4 rounded-2xl border border-[#E8D9BF] bg-white p-5 shadow-[0_8px_20px_rgba(58,35,24,0.05)]">
            {children}
          </div>
        )}
        {!isMobile && children}
      </div>
    </div>
  );
}
