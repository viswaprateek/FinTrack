import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Button } from '../../components/ui/Button'
import { IconArrowRight, IconWallet, IconRepeat, IconTarget } from '../../components/ui/icons'
import { Hero } from '../../components/landing/Hero'
import { FeatureCards } from '../../components/landing/FeatureCards'
import { HowItWorks } from '../../components/landing/HowItWorks'
import { Testimonials } from '../../components/landing/Testimonials'
import { AvatarStack } from '../../components/landing/AvatarStack'
import { LANDING_FACES } from '../../lib/landingFaces'

const features = [
  {
    icon: IconWallet,
    title: 'Envelope budgeting',
    description: 'Allocate every dollar to a category, track what you have left to spend, and roll over what you save.',
  },
  {
    icon: IconRepeat,
    title: 'Recurring bills',
    description: 'Automate rent, subscriptions, and bills. Get reminded before they post and never miss a payment.',
  },
  {
    icon: IconTarget,
    title: 'Savings goals',
    description: 'Set targets for what you want to save, track progress month by month, and stay motivated.',
  },
]

export function LandingPage() {
  return (
    <main className="relative">
      <Hero />

      <HowItWorks />

      {/* Features */}
      <section className="border-t border-border bg-surface-muted/50 dark:bg-surface-solid/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-heading">Everything you need to stay on target</h2>
            <p className="mt-4 text-muted-fg">
              Built around the way real people budget — by category, by month, with goals that keep you on track.
            </p>
          </motion.div>

          <FeatureCards features={features} />
        </div>
      </section>

      <Testimonials />

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 flex justify-center">
            <AvatarStack faces={LANDING_FACES} size="md" max={5} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-heading">Ready to take control of your money?</h2>
          <p className="mt-4 text-muted-fg">Create your free account and set up your first budget in minutes.</p>
          <div className="mt-8">
            <Link to="/sign-up">
              <Button size="md" className="px-6">
                Create your account
                <IconArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  )
}
