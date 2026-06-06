import type { AxiosInstance } from 'axios'
import type { Budget } from '../../types'

export interface BudgetCreateInput {
  name: string
  period_start: string
  period_end: string
  currency?: string
}

export interface BudgetUpdateInput {
  name?: string
  period_start?: string
  period_end?: string
  is_archived?: boolean
}

export const budgetsApi = {
  list: (client: AxiosInstance) => client.get<Budget[]>('/api/budgets').then((res) => res.data),
  get: (client: AxiosInstance, id: string) => client.get<Budget>(`/api/budgets/${id}`).then((res) => res.data),
  create: (client: AxiosInstance, payload: BudgetCreateInput) =>
    client.post<Budget>('/api/budgets', payload).then((res) => res.data),
  update: (client: AxiosInstance, id: string, payload: BudgetUpdateInput) =>
    client.patch<Budget>(`/api/budgets/${id}`, payload).then((res) => res.data),
  remove: (client: AxiosInstance, id: string) => client.delete(`/api/budgets/${id}`).then(() => undefined),
}
