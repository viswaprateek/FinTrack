import type { AxiosInstance } from 'axios'
import type { RecurringFrequency, RecurringRule, RecurringStatus, UpcomingBill } from '../../types'

export interface RecurringRuleCreateInput {
  name: string
  amount: number
  frequency: RecurringFrequency
  next_due: string
  category_id?: string | null
}

export interface RecurringRuleUpdateInput {
  name?: string
  amount?: number
  frequency?: RecurringFrequency
  next_due?: string
  category_id?: string | null
  status?: RecurringStatus
}

export interface PostRecurringRuleInput {
  budget_id: string
  date?: string
}

export const recurringApi = {
  list: (client: AxiosInstance) => client.get<RecurringRule[]>('/api/recurring-rules').then((res) => res.data),
  upcoming: (client: AxiosInstance, days?: number) =>
    client.get<UpcomingBill[]>('/api/recurring-rules/upcoming', { params: days ? { days } : undefined }).then((res) => res.data),
  create: (client: AxiosInstance, payload: RecurringRuleCreateInput) =>
    client.post<RecurringRule>('/api/recurring-rules', payload).then((res) => res.data),
  update: (client: AxiosInstance, id: string, payload: RecurringRuleUpdateInput) =>
    client.patch<RecurringRule>(`/api/recurring-rules/${id}`, payload).then((res) => res.data),
  remove: (client: AxiosInstance, id: string) => client.delete(`/api/recurring-rules/${id}`).then(() => undefined),
  post: (client: AxiosInstance, id: string, payload: PostRecurringRuleInput) =>
    client.post<RecurringRule>(`/api/recurring-rules/${id}/post`, payload).then((res) => res.data),
}
