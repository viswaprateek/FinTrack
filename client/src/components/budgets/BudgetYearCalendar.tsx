import type { Budget } from '../../types'
import {
  MONTH_OPTIONS,
  budgetForCalendarMonth,
  isCurrentCalendarMonth,
  monthlyBudgetPeriod,
} from '../../lib/budgets'
import { cn } from '../../lib/utils'

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

/** Seasonal header tints — subtle calendar-page accents by quarter. */
const MONTH_ACCENT: Record<number, string> = {
  1: 'from-sky-600/90 to-sky-500/70',
  2: 'from-sky-600/85 to-indigo-500/65',
  3: 'from-indigo-600/85 to-violet-500/65',
  4: 'from-emerald-600/85 to-teal-500/65',
  5: 'from-emerald-600/90 to-emerald-500/70',
  6: 'from-lime-600/80 to-emerald-500/65',
  7: 'from-amber-600/85 to-orange-500/65',
  8: 'from-orange-600/85 to-amber-500/65',
  9: 'from-rose-600/80 to-orange-500/60',
  10: 'from-violet-600/85 to-fuchsia-500/65',
  11: 'from-indigo-600/85 to-violet-500/65',
  12: 'from-sky-700/90 to-indigo-600/75',
}

interface BudgetYearCalendarProps {
  year: number
  budgets: Budget[]
  selectedMonth: number | null
  onSelectMonth: (month: number) => void
  formatCurrency: (amount: number) => string
}

function buildDayGrid(year: number, month: number): (number | null)[] {
  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (number | null)[] = Array.from({ length: firstWeekday }, () => null)
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day)
  }
  while (cells.length % 7 !== 0) {
    cells.push(null)
  }
  return cells
}

interface MonthTileProps {
  year: number
  month: number
  budget: Budget | null
  isCurrent: boolean
  isSelected: boolean
  isToday: (day: number) => boolean
  onSelect: () => void
  formatCurrency: (amount: number) => string
}

function MonthCalendarTile({
  year,
  month,
  budget,
  isCurrent,
  isSelected,
  isToday,
  onSelect,
  formatCurrency,
}: MonthTileProps) {
  const hasBudget = budget !== null
  const dayGrid = buildDayGrid(year, month)
  const spentPct =
    hasBudget && budget.plannedTotal > 0
      ? Math.min(100, Math.round((budget.spentTotal / budget.plannedTotal) * 100))
      : 0
  const overBudget = hasBudget && budget.plannedTotal > 0 && budget.spentTotal > budget.plannedTotal
  const accent = MONTH_ACCENT[month] ?? 'from-slate-600 to-slate-500'

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border text-left shadow-md shadow-black/25 transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/35',
        hasBudget
          ? 'border-border-muted/80 bg-gradient-to-b from-input/90 to-surface-solid'
          : 'border-border-muted/50 border-dashed bg-surface-solid/50',
        isSelected && 'border-accent/80 ring-2 ring-accent/40 ring-offset-2 ring-offset-background',
        isCurrent && !isSelected && 'ring-1 ring-accent/50',
      )}
    >
      {/* Binding holes */}
      <div className="absolute left-0 right-0 top-2.5 z-10 flex justify-center gap-6 opacity-40">
        <span className="h-1.5 w-1.5 rounded-full bg-background/80 ring-1 ring-white/10" />
        <span className="h-1.5 w-1.5 rounded-full bg-background/80 ring-1 ring-white/10" />
      </div>

      {/* Month header — tear-off calendar strip */}
      <div
        className={cn(
          'relative mt-1 bg-gradient-to-r px-3 pb-2.5 pt-5',
          accent,
        )}
      >
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-heading/70">{year}</p>
            <p className="text-lg font-bold leading-tight tracking-tight text-heading">{MONTH_OPTIONS[month - 1]}</p>
          </div>
          <p className="text-3xl font-light leading-none text-heading/25">{String(month).padStart(2, '0')}</p>
        </div>
        {isCurrent && (
          <span className="absolute right-2 top-2 rounded-md bg-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-heading backdrop-blur-sm">
            This month
          </span>
        )}
      </div>

      {/* Mini day grid */}
      <div className="px-2.5 pb-1 pt-2">
        <div className="mb-1 grid grid-cols-7 gap-0.5">
          {WEEKDAY_LABELS.map((label, i) => (
            <span
              key={`${label}-${i}`}
              className="text-center text-[8px] font-semibold uppercase text-muted"
            >
              {label}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {dayGrid.map((day, i) => {
            if (day === null) {
              return <span key={`empty-${i}`} className="aspect-square" />
            }
            const today = isToday(day)
            return (
              <span
                key={day}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-sm text-[9px] font-medium',
                  today
                    ? 'bg-accent font-bold text-slate-950 shadow-sm shadow-accent/40'
                    : hasBudget
                      ? 'text-muted-fg'
                      : 'text-muted',
                )}
              >
                {day}
              </span>
            )
          })}
        </div>
      </div>

      {/* Budget footer */}
      <div
        className={cn(
          'mt-auto border-t px-3 py-2.5',
          hasBudget ? 'border-border-muted/60 bg-background/40' : 'border-border/60 bg-background/20',
        )}
      >
        {hasBudget ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-[10px]">
              <span className="text-muted">Spent</span>
              <span className={cn('font-semibold tabular-nums', overBudget ? 'text-red-400' : 'text-foreground')}>
                {formatCurrency(budget.spentTotal)}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-input">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  overBudget ? 'bg-red-500' : spentPct > 85 ? 'bg-amber-500' : 'bg-accent',
                )}
                style={{ width: `${Math.min(100, spentPct)}%` }}
              />
            </div>
            <p className="text-[9px] text-muted">
              {spentPct}% of {formatCurrency(budget.plannedTotal)} planned
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5 py-0.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-border-muted text-muted transition-colors group-hover:border-accent/50 group-hover:text-accent">
              +
            </span>
            <span className="text-[10px] font-medium text-muted group-hover:text-muted-fg">Create budget</span>
          </div>
        )}
      </div>
    </button>
  )
}

export function BudgetYearCalendar({
  year,
  budgets,
  selectedMonth,
  onSelectMonth,
  formatCurrency,
}: BudgetYearCalendarProps) {
  const today = new Date()

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 12 }, (_, index) => {
        const month = index + 1
        const budget = budgetForCalendarMonth(budgets, year, month)
        const isCurrent = isCurrentCalendarMonth(year, month, today)

        return (
          <MonthCalendarTile
            key={month}
            year={year}
            month={month}
            budget={budget}
            isCurrent={isCurrent}
            isSelected={selectedMonth === month}
            isToday={(day) =>
              isCurrent && today.getDate() === day
            }
            onSelect={() => onSelectMonth(month)}
            formatCurrency={formatCurrency}
          />
        )
      })}
    </div>
  )
}

export function monthPeriodLabel(year: number, month: number) {
  return monthlyBudgetPeriod(year, month).name
}
