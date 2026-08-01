import type { ReactNode } from 'react';
import { RegisterStepper } from './RegisterStepper';
import type { RegisterStep } from '../../types/registerFlow';

type RegisterLayoutProps = {
  currentStep: RegisterStep;
  children: ReactNode;
  layout?: 'desktop' | 'mobile';
};

export function RegisterLayout({ currentStep, children, layout = 'desktop' }: RegisterLayoutProps) {
  const isMobile = layout === 'mobile';

  return (
    <div>
      <RegisterStepper currentStep={currentStep} />

      <div
        className={
          isMobile
            ? ''
            : 'mx-auto max-w-[600px] rounded-2xl border border-[#E8D9BF] bg-white p-8 shadow-[0_8px_24px_rgba(58,35,24,0.06)]'
        }
      >
        {isMobile && (
          <div className="rounded-2xl border border-[#E8D9BF] bg-white p-5 shadow-[0_8px_20px_rgba(58,35,24,0.05)]">
            {children}
          </div>
        )}
        {!isMobile && children}
      </div>
    </div>
  );
}
