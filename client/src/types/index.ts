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
  hasFriendSplit?: boolean
  notes?: string
}

export type ReminderFrequency = 'off' | 'weekly' | 'monthly'

export interface ExpenseShareParticipant {
  id: string
  email: string
  amountOwed: number
  status: 'pending' | 'paid'
  paidAt?: string | null
  lastRemindedAt?: string | null
}

export interface ExpenseShare {
  id: string
  transactionId: string
  description: string
  transactionDate: string
  totalAmount: number
  yourShare: number
  reminderFrequency: ReminderFrequency
  participants: ExpenseShareParticipant[]
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

export interface Goal {
  id: string
  name: string
  icon?: string | null
  targetAmount: number
  currentAmount: number
  targetDate?: string | null
  notes?: string | null
  percentComplete: number
  remainingAmount: number
  isComplete: boolean
  isArchived: boolean
}

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'paypal'
export type CardTheme = 'lime' | 'yellow' | 'navy' | 'emerald' | 'violet'

export interface CreditCard {
  id: string
  label: string
  cardholderName: string
  lastFour: string
  brand: CardBrand
  theme: CardTheme
  creditLimit: number
  currentBalance: number
  availableCredit: number
  utilizationPercent: number
  expiryMonth: number
  expiryYear: number
  isActive: boolean
}

export interface CardTransaction {
  id: string
  cardId: string
  cardLabel: string
  description: string
  amount: number
  category?: string | null
  transactedAt: string
}

export interface GoalContribution {
  id: string
  goalId: string
  amount: number
  note?: string | null
  contributedAt: string
}
