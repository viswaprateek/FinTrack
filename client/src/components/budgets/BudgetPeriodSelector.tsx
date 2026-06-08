import type { Budget } from '../../types'
import { IconChevronLeft, IconChevronRight } from '../ui/icons'

interface BudgetPeriodSelectorProps {
  budgets: Budget[]
  currentId: string
  onChange: (id: string) => void
  compact?: boolean
}

export function BudgetPeriodSelector({ budgets, currentId, onChange, compact }: BudgetPeriodSelectorProps) {
  // budgets arrive sorted period_start DESC → [Jun, May, Apr, …]
  const idx = budgets.findIndex((b) => b.id === currentId)
  const olderBudget = budgets[idx + 1] ?? null
  const newerBudget = budgets[idx - 1] ?? null

  const btnBase =
    'flex h-8 w-8 items-center justify-center rounded-lg border border-border-muted bg-input ' +
    'text-muted-fg transition-colors hover:bg-border-muted hover:text-foreground ' +
    'disabled:cursor-not-allowed disabled:opacity-30'

  if (budgets.length === 0) {
    return <span className="text-sm text-muted">No budgets yet</span>
  }

  return (
    <div className="flex items-center gap-1">
      <button
        className={btnBase}
        disabled={!olderBudget}
        onClick={() => olderBudget && onChange(olderBudget.id)}
        title={olderBudget ? `Go to ${olderBudget.period}` : 'No older budgets'}
        type="button"
      >
        <IconChevronLeft className="h-4 w-4" />
      </button>

      <select
        value={currentId}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 max-w-[10rem] cursor-pointer truncate rounded-lg border border-border-muted bg-input px-3 text-sm
                   font-medium text-foreground transition-colors hover:border-border-muted
                   focus:border-emerald-500 focus:outline-none sm:max-w-none"
      >
        {budgets.map((b) => (
          <option key={b.id} value={b.id}>
            {b.period}
          </option>
        ))}
      </select>

      <button
        className={btnBase}
        disabled={!newerBudget}
        onClick={() => newerBudget && onChange(newerBudget.id)}
        title={newerBudget ? `Go to ${newerBudget.period}` : 'No newer budgets'}
        type="button"
      >
        <IconChevronRight className="h-4 w-4" />
      </button>

      {!compact && budgets.length > 1 && (
        <span className="ml-1 text-xs text-muted">
          {idx + 1} / {budgets.length}
        </span>
      )}
    </div>
  )
}
