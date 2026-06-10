import { motion } from 'motion/react'
import { cn } from '../../lib/utils'

const steps = [
  {
    number: '01',
    title: 'Create your monthly budget',
    description:
      'Start with a fresh month. Add your income, then split every dollar into envelopes — groceries, rent, savings, fun money. Nothing slips through the cracks.',
    align: 'left' as const,
    Illustration: EnvelopeIllustration,
  },
  {
    number: '02',
    title: 'Log spending as it happens',
    description:
      'Every coffee, bill, and transfer goes against the right envelope. Watch bars fill up in real time so you always know what you have left to spend.',
    align: 'right' as const,
    Illustration: TransactionIllustration,
  },
  {
    number: '03',
    title: 'Automate recurring bills',
    description:
      'Set rent, subscriptions, and utilities to repeat automatically. FinTrack reminds you before they post and deducts them from the right category.',
    align: 'left' as const,
    Illustration: RecurringIllustration,
  },
  {
    number: '04',
    title: 'Work toward your goals',
    description:
      'Set savings targets for vacations, emergencies, or big purchases. Track progress each month and celebrate when you hit the mark.',
    align: 'right' as const,
    Illustration: GoalsIllustration,
  },
]

// Static path in % coords — stretches with the section, no JS measurement
const FLOW_PATH =
  'M 26 14 C 50 16, 74 18, 74 28 C 74 38, 50 40, 26 42 C 10 44, 26 48, 26 56 C 26 64, 50 66, 74 68 C 74 76, 50 78, 26 80 C 10 82, 26 86, 74 88'

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-background py-24 sm:py-32">
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-accent/80">How it works</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-heading sm:text-4xl lg:text-5xl">
            Built for people who want
            <br />
            <span className="text-accent">clarity, not spreadsheets</span>
          </h2>
          <p className="mt-5 text-lg text-muted-fg">
            We turned envelope budgeting into a simple four-step rhythm — so you always know where your money is
            going and what&apos;s left.
          </p>
        </div>

        <div className="relative mt-20 sm:mt-28">
          <svg
            className="pointer-events-none absolute inset-0 hidden h-full w-full text-accent/30 lg:block"
            viewBox="0 0 100 100"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d={FLOW_PATH}
              stroke="currentColor"
              strokeWidth="0.35"
              strokeLinecap="round"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div className="relative flex flex-col gap-20 sm:gap-28 lg:gap-36">
            {steps.map((step, i) => (
              <StepRow key={step.number} step={step} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function StepRow({
  step,
  index,
}: {
  step: (typeof steps)[number]
  index: number
}) {
  const graphicLeft = step.align === 'left'

  return (
    <motion.div
      className={cn(
        'relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16',
        !graphicLeft && 'lg:[&>*:first-child]:order-2',
      )}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <div className="flex justify-center lg:justify-end">
        <div className={cn('w-full max-w-md', graphicLeft ? 'lg:mr-4' : 'lg:ml-4 lg:justify-self-start')}>
          <IllustrationFrame>
            <step.Illustration />
          </IllustrationFrame>
        </div>
      </div>

      <div className={cn('flex flex-col justify-center', graphicLeft ? 'lg:pl-4' : 'lg:pr-4 lg:text-right lg:items-end')}>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-accent/30 bg-accent-muted text-xs font-bold text-accent">
          {step.number}
        </span>
        <h3 className="mt-4 text-2xl font-bold tracking-tight text-heading sm:text-3xl">{step.title}</h3>
        <p className="mt-4 max-w-md text-base leading-relaxed text-muted-fg sm:text-lg">{step.description}</p>
      </div>
    </motion.div>
  )
}

function IllustrationFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl border border-border bg-surface-solid p-6 shadow-sm shadow-black/5 dark:shadow-none dark:ring-1 dark:ring-white/[0.04] sm:p-8">
      <div className="absolute inset-0 rounded-2xl ring-1 ring-accent/10 dark:ring-accent/20" />
      <div className="relative">{children}</div>
    </div>
  )
}

/* ── Step illustrations ── */

function EnvelopeIllustration() {
  const envelopes = [
    { name: 'Groceries', pct: 72, color: 'bg-accent' },
    { name: 'Rent', pct: 100, color: 'bg-sky-400' },
    { name: 'Dining out', pct: 45, color: 'bg-amber-400' },
  ]

  return (
    <div className="space-y-3">
      {envelopes.map((env) => (
        <div key={env.name} className="rounded-xl border border-border bg-surface-muted p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-heading">{env.name}</span>
            <span className="text-xs text-muted">{env.pct}%</span>
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-border">
            <div className={cn('h-full rounded-full', env.color)} style={{ width: `${env.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function TransactionIllustration() {
  const txs = [
    { merchant: 'Whole Foods', amount: '-$47.20', cat: 'Groceries', tone: 'text-heading/80' },
    { merchant: 'Netflix', amount: '-$15.99', cat: 'Subscriptions', tone: 'text-heading/80' },
    { merchant: 'Paycheck', amount: '+$2,125.00', cat: 'Income', tone: 'text-success' },
  ]

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-solid">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-400/60" />
          <span className="h-2 w-2 rounded-full bg-amber-400/60" />
          <span className="h-2 w-2 rounded-full bg-accent/60" />
        </div>
        <span className="mx-auto text-[10px] text-muted">Transactions</span>
      </div>
      <div className="divide-y divide-border p-2">
        {txs.map((tx) => (
          <div key={tx.merchant} className="flex items-center justify-between px-3 py-3">
            <div>
              <p className="text-sm font-medium text-heading">{tx.merchant}</p>
              <p className="text-[10px] text-muted">{tx.cat}</p>
            </div>
            <span className={cn('text-sm font-semibold tabular-nums', tx.tone)}>{tx.amount}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecurringIllustration() {
  const bills = [
    { name: 'Rent', date: '1', amount: '$1,200' },
    { name: 'Spotify', date: '12', amount: '$11.99' },
    { name: 'Gym', date: '15', amount: '$45.00' },
  ]

  return (
    <div className="space-y-2">
      {bills.map((bill) => (
        <div key={bill.name} className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-accent-muted text-accent">
            <span className="text-[8px] uppercase leading-none">Jun</span>
            <span className="text-sm font-bold leading-tight">{bill.date}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-heading">{bill.name}</p>
            <p className="text-[10px] text-muted">Repeats monthly</p>
          </div>
          <span className="text-sm font-semibold tabular-nums text-heading">{bill.amount}</span>
        </div>
      ))}
    </div>
  )
}

function GoalsIllustration() {
  const goals = [
    { name: 'Emergency fund', saved: 3200, target: 5000, color: 'bg-accent' },
    { name: 'Vacation', saved: 450, target: 1500, color: 'bg-sky-400' },
    { name: 'New laptop', saved: 200, target: 1200, color: 'bg-amber-400' },
  ]

  return (
    <div className="space-y-3">
      {goals.map((goal) => {
        const pct = Math.round((goal.saved / goal.target) * 100)
        return (
          <div key={goal.name} className="rounded-xl border border-border bg-surface-muted p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-heading">{goal.name}</span>
              <span className="text-xs text-muted">{pct}%</span>
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-border">
              <div className={cn('h-full rounded-full', goal.color)} style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-[10px] text-muted">
              ${goal.saved.toLocaleString()} of ${goal.target.toLocaleString()}
            </p>
          </div>
        )
      })}
    </div>
  )
}
