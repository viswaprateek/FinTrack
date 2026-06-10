const STORAGE_KEY = 'active_budget_id'
const LEGACY_STORAGE_KEY = 'dashboard_budget_id'

export function readStoredBudgetId(): string | null {
  return localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
}

export function writeStoredBudgetId(id: string) {
  localStorage.setItem(STORAGE_KEY, id)
}
