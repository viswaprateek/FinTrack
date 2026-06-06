import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import {
  IconWallet,
  IconRepeat,
  IconTrendingUp,
  IconArrowRight,
  IconShield,
} from '../../components/ui/icons'

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

const stats = [
  { label: 'Monthly Income', value: '$4,250', tone: 'text-emerald-400' },
  { label: 'Planned Spending', value: '$2,780', tone: 'text-amber-400' },
  { label: 'Available', value: '$1,470', tone: 'text-sky-400' },
]

export function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-20 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-4 py-1.5 text-sm text-slate-300">
            <IconShield className="h-4 w-4 text-emerald-400" />
            Personal Finance • Envelope Budgeting
          </span>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Budget smarter,
            <br />
            <span className="text-emerald-400">month by month</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400">
            FinTrack helps you plan budgets, track spending, manage recurring bills, and forecast your
            cashflow — all in one clean, modern workspace.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/sign-up">
              <Button size="md" className="px-6">
                Get started free
                <IconArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/sign-in">
              <Button variant="secondary" size="md" className="px-6">
                Sign in
              </Button>
            </Link>
          </div>
        </div>

        {/* Stat preview cards */}
        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label} className="p-6 text-center">
              <p className={`text-3xl font-bold ${s.tone}`}>{s.value}</p>
              <p className="mt-2 text-sm text-slate-400">{s.label}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-800/80 bg-slate-900/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white">Everything you need to stay on target</h2>
            <p className="mt-4 text-slate-400">
              Built around the way real people budget — by category, by month, and with an eye on what's coming next.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white">Ready to take control of your money?</h2>
        <p className="mt-4 text-slate-400">Create your free account and set up your first budget in minutes.</p>
        <div className="mt-8">
          <Link to="/sign-up">
            <Button size="md" className="px-6">
              Create your account
              <IconArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  )
}
