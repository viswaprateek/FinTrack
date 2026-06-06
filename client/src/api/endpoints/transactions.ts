import type { AxiosInstance } from 'axios'
import type { ReimbursementStatus, Transaction } from '../../types'

export interface TransactionListParams {
  budget_id?: string
  category?: string
  type?: 'expense' | 'income'
  reimbursable?: ReimbursementStatus
  search?: string
}

export interface TransactionSplitInput {
  category_id?: string | null
  amount: number
  notes?: string | null
}

export interface TransactionCreateInput {
  budget_id: string
  category_id?: string | null
  date: string
  description: string
  amount: number
  type?: 'expense' | 'income'
  account?: string | null
  reimbursable?: ReimbursementStatus
  notes?: string | null
  splits?: TransactionSplitInput[]
}

export interface TransactionUpdateInput {
  category_id?: string | null
  date?: string
  description?: string
  amount?: number
  type?: 'expense' | 'income'
  account?: string | null
  reimbursable?: ReimbursementStatus
  reimbursed_amount?: number
  notes?: string | null
}

export const transactionsApi = {
  list: (client: AxiosInstance, params?: TransactionListParams) =>
    client.get<Transaction[]>('/api/transactions', { params }).then((res) => res.data),
  create: (client: AxiosInstance, payload: TransactionCreateInput) =>
    client.post<Transaction>('/api/transactions', payload).then((res) => res.data),
  update: (client: AxiosInstance, id: string, payload: TransactionUpdateInput) =>
    client.patch<Transaction>(`/api/transactions/${id}`, payload).then((res) => res.data),
  remove: (client: AxiosInstance, id: string) => client.delete(`/api/transactions/${id}`).then(() => undefined),
}
