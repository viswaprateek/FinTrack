import { useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { BudgetPeriodSelector } from '../budgets/BudgetPeriodSelector'
import { CurrencyConverter } from '../currency/CurrencyConverter'
import { ThemeToggle } from '../ui/ThemeToggle'
import { useBudgetPeriod } from '../../contexts/BudgetPeriodContext'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/budgets': 'Budgets',
  '/categories': 'Categories',
  '/transactions': 'Transactions',
  '/recurring': 'Recurring Bills',
  '/reports': 'Reports & Forecasts',
  '/settings': 'Settings',
}

function pageTitle(pathname: string): string {
  if (titles[pathname]) return titles[pathname]
  if (pathname.startsWith('/budgets/')) return 'Budget Detail'
  return 'FinTrack'
}

/** Pages that manage budgets themselves — month selector lives in page content. */
const HIDE_PERIOD_SELECTOR = new Set(['/budgets'])

export function Topbar() {
  const { pathname } = useLocation()
  const { budgets, currentBudget, selectBudget } = useBudgetPeriod()
  const showPeriodSelector = !HIDE_PERIOD_SELECTOR.has(pathname) && budgets.length > 0 && currentBudget

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
        <h1 className="truncate text-base font-semibold text-heading sm:text-lg">{pageTitle(pathname)}</h1>
        {showPeriodSelector && (
          <BudgetPeriodSelector
            budgets={budgets}
            currentId={currentBudget.id}
            onChange={selectBudget}
            compact
          />
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <CurrencyConverter />
        <div className="lg:hidden">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  )
}
