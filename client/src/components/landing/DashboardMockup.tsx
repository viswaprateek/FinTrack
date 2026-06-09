import { cn } from '../../lib/utils'

const categories = [
  { name: 'Groceries', spent: 320, budget: 400, color: 'bg-accent' },
  { name: 'Rent', spent: 1200, budget: 1200, color: 'bg-sky-500' },
  { name: 'Dining', spent: 185, budget: 150, color: 'bg-amber-500' },
  { name: 'Transport', spent: 92, budget: 200, color: 'bg-violet-500' },
]

const barHeights = [40, 65, 45, 80, 55, 70, 50, 85, 60, 75, 48, 90]

interface DashboardMockupProps {
  className?: string
}

export function DashboardMockup({ className }: DashboardMockupProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-surface-solid shadow-lg shadow-black/10 dark:shadow-none dark:ring-1 dark:ring-white/[0.06]',
        className,
      )}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-surface-solid/80 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
        </div>
        <span className="mx-auto text-xs text-muted">FinTrack — June 2026</span>
      </div>

      <div className="p-4 sm:p-5">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: 'Income', value: '$4,250', tone: 'text-success' },
            { label: 'Spent', value: '$2,780', tone: 'text-amber-400' },
            { label: 'Available', value: '$1,470', tone: 'text-sky-400' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-surface-muted/50 px-2 py-2.5 text-center sm:px-3">
              <p className={`text-sm font-bold sm:text-lg ${stat.tone}`}>{stat.value}</p>
              <p className="mt-0.5 text-[10px] text-muted sm:text-xs">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Mini chart */}
        <div className="mt-4 rounded-xl border border-border bg-surface-muted/30 p-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted sm:text-xs">
            Spending trend
          </p>
          <div className="flex h-16 items-end gap-1 sm:h-20">
            {barHeights.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-accent/60 transition-all"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Category progress */}
        <div className="mt-4 space-y-2.5">
          {categories.map((cat) => {
            const pct = Math.min(100, (cat.spent / cat.budget) * 100)
            const over = cat.spent > cat.budget
            return (
              <div key={cat.name}>
                <div className="mb-1 flex justify-between text-[10px] sm:text-xs">
                  <span className="text-subtle">{cat.name}</span>
                  <span className={over ? 'text-amber-400' : 'text-muted'}>
                    ${cat.spent} / ${cat.budget}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-input">
                  <div
                    className={cn('h-full rounded-full', over ? 'bg-amber-500' : cat.color)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
