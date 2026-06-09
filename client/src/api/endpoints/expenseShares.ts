import type { AxiosInstance } from 'axios'
import type { ExpenseShare, ReminderFrequency } from '../../types'

export interface FriendSplitInput {
  email: string
  amount: number
}

export interface ExpenseShareParticipantUpdate {
  status?: 'pending' | 'paid'
}

export interface ExpenseShareUpdate {
  reminder_frequency?: ReminderFrequency
}

export interface PublicOweView {
  payerName: string
  description: string
  date: string
  amountOwed: number
  currency: string
  status: 'pending' | 'paid'
}

export const expenseSharesApi = {
  list: (client: AxiosInstance) =>
    client.get<ExpenseShare[]>('/api/expense-shares').then((res) => res.data),

  outstandingTotal: (client: AxiosInstance) =>
    client.get<{ total: number }>('/api/expense-shares/outstanding-total').then((res) => res.data),

  get: (client: AxiosInstance, id: string) =>
    client.get<ExpenseShare>(`/api/expense-shares/${id}`).then((res) => res.data),

  update: (client: AxiosInstance, id: string, payload: ExpenseShareUpdate) =>
    client.patch<ExpenseShare>(`/api/expense-shares/${id}`, payload).then((res) => res.data),

  updateParticipant: (client: AxiosInstance, participantId: string, payload: ExpenseShareParticipantUpdate) =>
    client
      .patch<ExpenseShare>(`/api/expense-shares/participants/${participantId}`, payload)
      .then((res) => res.data),

  publicOwe: (token: string) => {
    const base = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'
    return fetch(`${base}/api/public/owe/${token}`).then(async (res) => {
      if (!res.ok) throw new Error('Link not found')
      return res.json() as Promise<PublicOweView>
    })
  },
}
