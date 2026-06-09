import type { Budget } from '../../types'
import { budgetForCalendarMonth, monthFromBudget } from '../../lib/budgets'
import { BudgetFolder } from './BudgetFolder'

interface BudgetYearFoldersProps {
  year: number
  budgets: Budget[]
  activeBudgetId: string | null
  selectedMonth: number | null
  onSelectMonth: (month: number) => void
  formatCurrency: (amount: number) => string
}

function featuredMonthForYear(year: number, activeBudget: Budget | null, today = new Date()): number {
  if (activeBudget) {
    const fromActive = monthFromBudget(activeBudget)
    if (fromActive?.year === year) return fromActive.month
  }
  if (today.getFullYear() === year) return today.getMonth() + 1
  return 1
}

export function BudgetYearFolders({
  year,
  budgets,
  activeBudgetId,
  selectedMonth,
  onSelectMonth,
  formatCurrency,
}: BudgetYearFoldersProps) {
  const today = new Date()
  const activeBudget = budgets.find((b) => b.id === activeBudgetId) ?? null
  const featuredMonth = featuredMonthForYear(year, activeBudget, today)
  const otherMonths = Array.from({ length: 12 }, (_, i) => i + 1).filter((m) => m !== featuredMonth)

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <BudgetFolder
        month={featuredMonth}
        budget={budgetForCalendarMonth(budgets, year, featuredMonth)}
        featured
        isActive={activeBudget?.id === budgetForCalendarMonth(budgets, year, featuredMonth)?.id}
        isSelected={selectedMonth === featuredMonth}
        onSelect={() => onSelectMonth(featuredMonth)}
        formatCurrency={formatCurrency}
      />

      <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
        {otherMonths.map((month) => {
          const budget = budgetForCalendarMonth(budgets, year, month)
          return (
            <BudgetFolder
              key={month}
              month={month}
              budget={budget}
              isActive={activeBudget?.id === budget?.id}
              isSelected={selectedMonth === month}
              onSelect={() => onSelectMonth(month)}
              formatCurrency={formatCurrency}
            />
          )
        })}
      </div>
    </div>
  )
}
