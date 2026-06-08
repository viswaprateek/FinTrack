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
    title: 'See what\'s coming next',
    description:
      'Your cashflow forecast projects your balance day by day. Catch a shortfall weeks before it happens — not the morning your card declines.',
    align: 'right' as const,
    Illustration: ForecastIllustration,
  },
]

// Static path in % coords — stretches with the section, no JS measurement
const FLOW_PATH =
  'M 26 14 C 50 16, 74 18, 74 28 C 74 38, 50 40, 26 42 C 10 44, 26 48, 26 56 C 26 64, 50 66, 74 68 C 74 76, 50 78, 26 80 C 10 82, 26 86, 74 88'

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden border-t border-border/80 bg-background py-24 sm:py-32">
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-400/80">How it works</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-heading sm:text-4xl lg:text-5xl">
            Built for people who want
            <br />
            <span className="text-emerald-400">clarity, not spreadsheets</span>
          </h2>
          <p className="mt-5 text-lg text-muted-fg">
            We turned envelope budgeting into a simple four-step rhythm — so you always know where your money is
            going and what&apos;s left.
          </p>
        </div>

        <div className="relative mt-20 sm:mt-28">
          <svg
            className="pointer-events-none absolute inset-0 hidden h-full w-full text-emerald-400/50 lg:block"
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
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-400">
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
    <div className="relative rounded-3xl bg-gradient-to-br from-emerald-950 to-emerald-900/80 p-6 shadow-xl shadow-emerald-950/40 sm:p-8">
      <div className="absolute inset-0 rounded-3xl ring-1 ring-emerald-500/20" />
      <div className="relative">{children}</div>
    </div>
  )
}

/* ── Step illustrations ── */

function EnvelopeIllustration() {
  const envelopes = [
    { name: 'Groceries', pct: 72, color: 'bg-emerald-400' },
    { name: 'Rent', pct: 100, color: 'bg-sky-400' },
    { name: 'Dining out', pct: 45, color: 'bg-amber-400' },
  ]

  return (
    <div className="space-y-3">
      {envelopes.map((env) => (
        <div key={env.name} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-heading/90">{env.name}</span>
            <span className="text-xs text-heading/50">{env.pct}%</span>
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/10">
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
    { merchant: 'Paycheck', amount: '+$2,125.00', cat: 'Income', tone: 'text-emerald-400' },
  ]

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-400/60" />
          <span className="h-2 w-2 rounded-full bg-amber-400/60" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/60" />
        </div>
        <span className="mx-auto text-[10px] text-heading/40">Transactions</span>
      </div>
      <div className="divide-y divide-white/5 p-2">
        {txs.map((tx) => (
          <div key={tx.merchant} className="flex items-center justify-between px-3 py-3">
            <div>
              <p className="text-sm font-medium text-heading/90">{tx.merchant}</p>
              <p className="text-[10px] text-heading/40">{tx.cat}</p>
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
        <div key={bill.name} className="flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-white/5 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
            <span className="text-[8px] uppercase leading-none">Jun</span>
            <span className="text-sm font-bold leading-tight">{bill.date}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-heading/90">{bill.name}</p>
            <p className="text-[10px] text-heading/40">Repeats monthly</p>
          </div>
          <span className="text-sm font-semibold tabular-nums text-heading/70">{bill.amount}</span>
        </div>
      ))}
    </div>
  )
}

function ForecastIllustration() {
  const points = [30, 45, 38, 55, 48, 62, 58, 72, 65, 80, 75, 88]
  const w = 280
  const h = 100
  const max = Math.max(...points)
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w
    const y = h - (p / max) * h
    return `${x},${y}`
  })
  const linePath = `M ${coords.join(' L ')}`
  const areaPath = `${linePath} L ${w},${h} L 0,${h} Z`

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-heading/40">Projected balance</p>
          <p className="text-2xl font-bold text-emerald-400">$1,470</p>
        </div>
        <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
          +30 days
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" aria-hidden>
        <defs>
          <linearGradient id="forecast-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#forecast-fill)" />
        <path d={linePath} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="0" y1={h * 0.85} x2={w} y2={h * 0.85} stroke="#f87171" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
      </svg>
    </div>
  )
}
