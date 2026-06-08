export type RolloverType = 'reset' | 'rollover' | 'capped'

export interface Budget {
  id: string
  name: string
  period: string
  periodStart: string
  periodEnd: string
  plannedTotal: number
  spentTotal: number
}

export interface Category {
  id: string
  name: string
  planned: number
  spent: number
  rolloverType: RolloverType
  rolloverCap?: number
}

export interface CategoryLibraryItem {
  id: string
  name: string
  icon?: string | null
}

export type ReimbursementStatus = 'none' | 'pending' | 'received'

export interface Transaction {
  id: string
  budgetId: string
  categoryId?: string | null
  date: string
  description: string
  category: string
  account: string
  amount: number
  reimbursable: ReimbursementStatus
  isSplit: boolean
  notes?: string
}

export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly'
export type RecurringStatus = 'active' | 'paused'

export interface RecurringRule {
  id: string
  name: string
  amount: number
  frequency: RecurringFrequency
  nextDue: string
  category: string
  status: RecurringStatus
}

export interface UpcomingBill {
  id: string
  name: string
  dueDate: string
  amount: number
  category: string
}

export type IncomeSchedule = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'custom'

export interface IncomeSource {
  id: string
  name: string
  amount: number
  schedule: IncomeSchedule
  notes?: string | null
}
