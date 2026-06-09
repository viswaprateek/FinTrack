export type OnboardingStep = 'welcome' | 'currency' | 'budget' | 'envelopes' | 'transactions'

export interface EnvelopeDraft {
  name: string
  icon: string
  planned: string
}

export interface TransactionDraft {
  type: 'income' | 'expense'
  categoryId: string
  categoryName: string
  description: string
  amount: string
  date: string
}

export interface OnboardingDraft {
  step: OnboardingStep
  currency: string
  budgetId: string | null
  envelopes: EnvelopeDraft[]
  transactions: TransactionDraft[]
}

const STORAGE_KEY = 'fintrack-onboarding-draft'

export const ONBOARDING_STEPS: OnboardingStep[] = [
  'welcome',
  'currency',
  'budget',
  'envelopes',
  'transactions',
]

export const STEP_LABELS: Record<OnboardingStep, string> = {
  welcome: 'Welcome',
  currency: 'Currency',
  budget: 'Budget',
  envelopes: 'Envelopes',
  transactions: 'Transactions',
}

export function readOnboardingDraft(): OnboardingDraft | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as OnboardingDraft
  } catch {
    return null
  }
}

export function writeOnboardingDraft(draft: OnboardingDraft): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
}

export function clearOnboardingDraft(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
