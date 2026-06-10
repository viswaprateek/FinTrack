import type { AxiosInstance } from 'axios'
import type { ExpenseShare, OwedExpense, ParticipantUpdateResult } from '../../types'

export interface FriendSplitInput {
  email: string
  amount: number
}

export interface ExpenseShareParticipantUpdate {
  status?: 'pending' | 'paid'
}

export const expenseSharesApi = {
  list: (client: AxiosInstance) =>
    client.get<ExpenseShare[]>('/api/expense-shares').then((res) => res.data),

  outstandingTotal: (client: AxiosInstance) =>
    client.get<{ total: number }>('/api/expense-shares/outstanding-total').then((res) => res.data),

  listOwed: (client: AxiosInstance) =>
    client.get<OwedExpense[]>('/api/expense-shares/owed').then((res) => res.data),

  owedTotal: (client: AxiosInstance) =>
    client.get<{ total: number }>('/api/expense-shares/owed-total').then((res) => res.data),

  get: (client: AxiosInstance, id: string) =>
    client.get<ExpenseShare>(`/api/expense-shares/${id}`).then((res) => res.data),

  updateParticipant: (client: AxiosInstance, participantId: string, payload: ExpenseShareParticipantUpdate) =>
    client
      .patch<ParticipantUpdateResult>(`/api/expense-shares/participants/${participantId}`, payload)
      .then((res) => res.data),
}
