import type { AxiosInstance } from 'axios'
import type { Budget, Category, IncomeSource, Transaction, UpcomingBill } from '../../types'

export interface DashboardBootstrap {
  budgets: Budget[]
  activeBudgetId: string | null
  categories: Category[]
  transactions: Transaction[]
  upcomingBills: UpcomingBill[]
  incomeSources: IncomeSource[]
  friendsOweTotal: number
  youOweTotal: number
}

export const dashboardApi = {
  bootstrap: (client: AxiosInstance, budgetId?: string) =>
    client
      .get<DashboardBootstrap>('/api/dashboard', {
        params: budgetId ? { budget_id: budgetId } : undefined,
      })
      .then((res) => res.data),
}
