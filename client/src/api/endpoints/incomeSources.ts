import type { AxiosInstance } from 'axios'
import type { IncomeSchedule, IncomeSource } from '../../types'

export interface IncomeSourceCreateInput {
  name: string
  amount: number
  schedule?: IncomeSchedule
  notes?: string | null
}

export interface IncomeSourceUpdateInput {
  name?: string
  amount?: number
  schedule?: IncomeSchedule
  notes?: string | null
}

export const incomeSourcesApi = {
  listForBudget: (client: AxiosInstance, budgetId: string) =>
    client.get<IncomeSource[]>(`/api/budgets/${budgetId}/income-sources`).then((res) => res.data),
  create: (client: AxiosInstance, budgetId: string, payload: IncomeSourceCreateInput) =>
    client.post<IncomeSource>(`/api/budgets/${budgetId}/income-sources`, payload).then((res) => res.data),
  update: (client: AxiosInstance, budgetId: string, sourceId: string, payload: IncomeSourceUpdateInput) =>
    client.patch<IncomeSource>(`/api/budgets/${budgetId}/income-sources/${sourceId}`, payload).then((res) => res.data),
  remove: (client: AxiosInstance, budgetId: string, sourceId: string) =>
    client.delete(`/api/budgets/${budgetId}/income-sources/${sourceId}`).then(() => undefined),
}
