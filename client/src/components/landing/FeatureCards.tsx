import { motion, type Variants } from 'motion/react'
import { Card } from '../ui/Card'
import { TiltCard } from './TiltCard'
import type { ComponentType, SVGProps } from 'react'

interface Feature {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  title: string
  description: string
}

interface FeatureCardsProps {
  features: Feature[]
}

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12 },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function FeatureCards({ features }: FeatureCardsProps) {
  return (
    <motion.div
      className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
    >
      {features.map(({ icon: Icon, title, description }) => (
        <motion.div key={title} variants={item}>
          <TiltCard maxTilt={6}>
          <Card className="h-full p-6 transition-colors hover:border-accent/30 hover:bg-surface-solid/80">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-muted text-accent">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-base font-semibold text-heading">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-fg">{description}</p>
          </Card>
          </TiltCard>
        </motion.div>
      ))}
    </motion.div>
  )
}
