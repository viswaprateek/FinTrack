import { ONBOARDING_STEPS, STEP_LABELS, type OnboardingStep } from '../../../lib/onboardingDraft'
import { cn } from '../../../lib/utils'

interface OnboardingProgressProps {
  step: OnboardingStep
}

export function OnboardingProgress({ step }: OnboardingProgressProps) {
  const currentIndex = ONBOARDING_STEPS.indexOf(step)

  return (
    <div className="mb-8 space-y-3">
      <div className="flex justify-center gap-1.5">
        {ONBOARDING_STEPS.map((s, i) => (
          <div
            key={s}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-all duration-500 ease-out',
              i <= currentIndex ? 'bg-emerald-400' : 'bg-input',
              i === currentIndex && 'scale-y-125 shadow-[0_0_8px_rgba(52,211,153,0.45)]',
            )}
          />
        ))}
      </div>
      <p className="text-center text-xs text-muted">
        Step {currentIndex + 1} of {ONBOARDING_STEPS.length}
        <span className="mx-1.5 text-border-muted">·</span>
        <span className="text-subtle">{STEP_LABELS[step]}</span>
      </p>
    </div>
  )
}
