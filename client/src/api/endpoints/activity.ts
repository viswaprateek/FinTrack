import type { AxiosInstance } from 'axios'

export interface ActivityDay {
  date: string
  count: number
  level: number
}

export interface ActivityStats {
  activeDays: number
  totalExpenses: number
  currentStreak: number
  longestStreak: number
}

export interface ActivityResponse {
  days: ActivityDay[]
  stats: ActivityStats
}

export const activityApi = {
  get: (client: AxiosInstance) => client.get<ActivityResponse>('/api/me/activity').then((res) => res.data),
}
