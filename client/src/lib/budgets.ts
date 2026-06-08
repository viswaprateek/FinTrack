import type { Budget } from '../types'

/** Pick the budget whose period contains the given date (YYYY-MM-DD). */
export function budgetForDate(budgets: Budget[], date: string): Budget | null {
  const day = date.substring(0, 10)
  return budgets.find((b) => b.periodStart <= day && b.periodEnd >= day) ?? null
}

export function isDateInBudget(date: string, budget: Budget): boolean {
  const day = date.substring(0, 10)
  return day >= budget.periodStart && day <= budget.periodEnd
}

export function clampDateToBudget(date: string, budget: Budget): string {
  const day = date.substring(0, 10)
  if (day < budget.periodStart) return budget.periodStart
  if (day > budget.periodEnd) return budget.periodEnd
  return day
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** Calendar month period: e.g. month 6, year 2026 → Jun 1 – Jun 30 */
export function monthlyBudgetPeriod(year: number, month: number) {
  const lastDay = new Date(year, month, 0).getDate()
  const periodStart = `${year}-${pad(month)}-01`
  const periodEnd = `${year}-${pad(month)}-${pad(lastDay)}`
  const name = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  return { name, periodStart, periodEnd }
}

export const MONTH_OPTIONS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

export const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

/** Budget whose period matches the calendar month (period_start = YYYY-MM-01). */
export function budgetForCalendarMonth(budgets: Budget[], year: number, month: number): Budget | null {
  const { periodStart } = monthlyBudgetPeriod(year, month)
  return budgets.find((b) => b.periodStart === periodStart) ?? null
}

export function isCurrentCalendarMonth(year: number, month: number, today = new Date()): boolean {
  return today.getFullYear() === year && today.getMonth() + 1 === month
}

/** Nearest prior month (walking backwards) that already has a budget — for envelope copy defaults. */
export function findPriorBudgetForCopy(budgets: Budget[], year: number, month: number): Budget | null {
  let y = year
  let m = month
  for (let i = 0; i < 24; i++) {
    if (m === 1) {
      y -= 1
      m = 12
    } else {
      m -= 1
    }
    const match = budgetForCalendarMonth(budgets, y, m)
    if (match) return match
  }
  return null
}
