import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'

interface OnboardingStepPanelProps {
  stepKey: string
  children: ReactNode
}

export function OnboardingStepPanel({ stepKey, children }: OnboardingStepPanelProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
