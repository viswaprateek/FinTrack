import type { Budget } from '../../types'
import { MONTH_OPTIONS, MONTH_SHORT } from '../../lib/budgets'
import { cn } from '../../lib/utils'

interface BudgetFolderProps {
  month: number
  budget: Budget | null
  featured?: boolean
  isActive?: boolean
  isSelected?: boolean
  onSelect: () => void
  formatCurrency: (amount: number) => string
}

export function BudgetFolder({
  month,
  budget,
  featured = false,
  isActive = false,
  isSelected = false,
  onSelect,
  formatCurrency,
}: BudgetFolderProps) {
  const hasBudget = budget !== null
  const monthName = MONTH_OPTIONS[month - 1]
  const shortMonth = MONTH_SHORT[month - 1]
  const spentPct =
    hasBudget && budget.plannedTotal > 0
      ? Math.min(100, Math.round((budget.spentTotal / budget.plannedTotal) * 100))
      : 0

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group flex flex-col items-center gap-2 rounded-lg p-1.5 transition-colors',
        featured ? 'w-48' : 'w-32',
        isSelected && 'bg-blue-500/15 ring-1 ring-blue-400/50',
      )}
    >
      <div className="relative aspect-square w-full">
        {/* Tab */}
        <div
          className={cn(
            'absolute left-[9%] top-0 z-10 rounded-t-[4px]',
            'bg-gradient-to-b shadow-sm',
            hasBudget ? 'from-[#9dd4fc] to-[#6bb8f5]' : 'from-[#bdd8ee] to-[#a3c9e6]',
            featured ? 'h-[11%] w-[36%]' : 'h-[11%] w-[36%]',
            'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:rounded-t-[4px] before:bg-white/55',
          )}
        />

        {/* Body */}
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 top-[7%] flex flex-col overflow-hidden rounded-[5px]',
            'bg-gradient-to-b shadow-md transition-[filter] group-hover:brightness-105',
            hasBudget
              ? 'from-[#7ec8f7] to-[#3b82d8] shadow-blue-900/20'
              : 'from-[#b4d4eb] to-[#8eb8d6] shadow-slate-900/10',
            'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-px before:bg-white/50',
          )}
        >
          {hasBudget ? (
            <div
              className={cn(
                'relative flex flex-1 flex-col text-white',
                featured ? 'px-3 pb-3 pt-3' : 'px-2 pb-2 pt-2',
              )}
            >
              {isActive && (
                <span
                  className={cn(
                    'absolute right-2 top-1.5 font-semibold uppercase tracking-wide text-white/65',
                    featured ? 'text-[9px]' : 'text-[7px]',
                  )}
                >
                  Active
                </span>
              )}
              <p
                className={cn(
                  'mt-auto truncate font-medium leading-tight drop-shadow-sm',
                  featured ? 'text-xs' : 'text-[9px]',
                )}
              >
                {formatCurrency(budget.spentTotal)}
              </p>
              <p className={cn('truncate text-white/70', featured ? 'text-[10px]' : 'text-[8px]')}>
                of {formatCurrency(budget.plannedTotal)}
              </p>
              <div
                className={cn('overflow-hidden rounded-full bg-black/15', featured ? 'mt-1.5 h-1.5' : 'mt-1 h-1')}
              >
                <div className="h-full rounded-full bg-white/75" style={{ width: `${spentPct}%` }} />
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <span className={cn('font-light text-white/45', featured ? 'text-3xl' : 'text-xl')}>+</span>
            </div>
          )}
        </div>
      </div>

      <span
        className={cn(
          'max-w-full truncate text-center leading-tight',
          featured ? 'text-base font-medium' : 'text-sm',
          isSelected ? 'font-semibold text-heading' : 'text-muted-fg',
        )}
      >
        {featured ? monthName : shortMonth}
      </span>
    </button>
  )
}
