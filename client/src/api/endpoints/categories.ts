import type { AxiosInstance } from 'axios'
import type { Category, RolloverType } from '../../types'

export interface CategoryCreateInput {
  name: string
  planned_amount?: number
  rollover_type?: RolloverType
  rollover_cap?: number | null
}

export interface CategoryUpdateInput {
  name?: string
  planned_amount?: number
  rollover_type?: RolloverType
  rollover_cap?: number | null
}

export interface MoveFundsInput {
  from_category_id: string
  to_category_id: string
  amount: number
  note?: string | null
}

export const categoriesApi = {
  listForBudget: (client: AxiosInstance, budgetId: string) =>
    client.get<Category[]>(`/api/budgets/${budgetId}/categories`).then((res) => res.data),
  create: (client: AxiosInstance, budgetId: string, payload: CategoryCreateInput) =>
    client.post<Category>(`/api/budgets/${budgetId}/categories`, payload).then((res) => res.data),
  update: (client: AxiosInstance, budgetId: string, categoryId: string, payload: CategoryUpdateInput) =>
    client.patch<Category>(`/api/budgets/${budgetId}/categories/${categoryId}`, payload).then((res) => res.data),
  remove: (client: AxiosInstance, budgetId: string, categoryId: string) =>
    client.delete(`/api/budgets/${budgetId}/categories/${categoryId}`).then(() => undefined),
  moveFunds: (client: AxiosInstance, budgetId: string, payload: MoveFundsInput) =>
    client.post(`/api/budgets/${budgetId}/categories/move-funds`, payload).then(() => undefined),
}
