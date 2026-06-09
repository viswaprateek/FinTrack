import type { AxiosInstance } from 'axios'

export interface OnboardingCompleteInput {
  seed_demo?: boolean
  default_currency?: string
}

export interface OnboardingCompleteResponse {
  onboardingCompleted: boolean
  seededDemo: boolean
}

export const onboardingApi = {
  complete: (client: AxiosInstance, payload: OnboardingCompleteInput) =>
    client.post<OnboardingCompleteResponse>('/api/onboarding/complete', payload).then((res) => res.data),
}
