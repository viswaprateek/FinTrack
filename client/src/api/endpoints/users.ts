import type { AxiosInstance } from 'axios'

export interface MeResponse {
  user_id: number
  clerk_user_id: string
  email: string
  first_name: string | null
  default_currency: string
  shareRemindersEnabled: boolean
  onboardingCompleted: boolean
}

export interface UserPreferencesUpdate {
  default_currency?: string
  share_reminders_enabled?: boolean
}

export const usersApi = {
  getMe: (client: AxiosInstance) => client.get<MeResponse>('/api/me').then((res) => res.data),

  updatePreferences: (client: AxiosInstance, payload: UserPreferencesUpdate) =>
    client.patch<MeResponse>('/api/me/preferences', payload).then((res) => res.data),
}
