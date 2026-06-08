import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Button } from '../../components/ui/Button'
import { IconArrowRight, IconWallet, IconRepeat, IconTrendingUp } from '../../components/ui/icons'
import { CursorTrail } from '../../components/landing/CursorTrail'
import { Hero } from '../../components/landing/Hero'
import { FeatureCards } from '../../components/landing/FeatureCards'
import { HowItWorks } from '../../components/landing/HowItWorks'

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
    icon: IconTrendingUp,
    title: 'Cashflow forecasting',
    description: 'See your projected balance day by day, and catch risk of going negative before it happens.',
  },
]

export function LandingPage() {
  return (
    <main className="relative">
      <CursorTrail />
      <Hero />

      <HowItWorks />

      {/* Features */}
      <section className="border-t border-border/80 bg-surface-solid/30">
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
              Built around the way real people budget — by category, by month, and with an eye on what's coming next.
            </p>
          </motion.div>

          <FeatureCards features={features} />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
        >
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
