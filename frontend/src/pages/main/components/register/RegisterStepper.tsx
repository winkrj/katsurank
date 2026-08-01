import { REGISTER_STEPS } from '../../constants'
import type { RegisterStep } from '../../types/registerFlow'

type RegisterStepperProps = {
  currentStep: RegisterStep
}

const STEP_ORDER: RegisterStep[] = ['search', 'location', 'confirm']

export function RegisterStepper({ currentStep }: RegisterStepperProps) {
  if (currentStep === 'complete') return null

  const currentIndex = STEP_ORDER.indexOf(currentStep)

  return (
    <ol className="mb-8 flex items-center justify-center gap-2 sm:gap-4">
      {REGISTER_STEPS.map((step, index) => {
        const isActive = index === currentIndex
        const isDone = index < currentIndex

        return (
          <li key={step.key} className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={[
                  'flex size-8 items-center justify-center rounded-full text-[13px] font-black',
                  isActive
                    ? 'border-2 border-[#DBBA24] bg-[#FFC533] text-[#2A1A12]'
                    : isDone
                      ? 'border-2 border-[#DBBA24] bg-[#FFF4D8] text-[#7A431D]'
                      : 'border border-[#E8D9BF] bg-white text-[#8A7A6A]',
                ].join(' ')}
              >
                {index + 1}
              </span>
              <span
                className={[
                  'whitespace-nowrap text-[11px] font-bold sm:text-[12px]',
                  isActive ? 'text-[#2A1A12]' : 'text-[#8A7A6A]',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>

            {index < REGISTER_STEPS.length - 1 && (
              <span
                className={[
                  'mb-5 hidden h-0.5 w-8 sm:block sm:w-12',
                  index < currentIndex ? 'bg-[#FFC533]' : 'bg-[#E8D9BF]',
                ].join(' ')}
                aria-hidden
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
