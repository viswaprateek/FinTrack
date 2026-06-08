import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApiClient, budgetsApi } from '../api'
import { budgetForDate } from '../lib/budgets'
import type { Budget } from '../types'

const STORAGE_KEY = 'active_budget_id'
const LEGACY_STORAGE_KEY = 'dashboard_budget_id'

interface BudgetPeriodContextValue {
  budgets: Budget[]
  currentBudget: Budget | null
  selectBudget: (id: string) => void
  isLoading: boolean
}

const BudgetPeriodContext = createContext<BudgetPeriodContextValue | null>(null)

function readStoredBudgetId(): string | null {
  return localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
}

export function BudgetPeriodProvider({ children }: { children: ReactNode }) {
  const client = useApiClient()

  const budgetsQuery = useQuery({
    queryKey: ['budgets'],
    queryFn: () => budgetsApi.list(client),
  })
  const budgets = budgetsQuery.data ?? []

  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(readStoredBudgetId)

  const currentBudget = useMemo(() => {
    if (!budgets.length) return null
    if (selectedBudgetId) {
      const found = budgets.find((b) => b.id === selectedBudgetId)
      if (found) return found
    }
    const today = new Date().toISOString().slice(0, 10)
    return budgetForDate(budgets, today) ?? budgets[0]
  }, [budgets, selectedBudgetId])

  const selectBudget = useCallback((id: string) => {
    setSelectedBudgetId(id)
    localStorage.setItem(STORAGE_KEY, id)
  }, [])

  const value = useMemo<BudgetPeriodContextValue>(
    () => ({
      budgets,
      currentBudget,
      selectBudget,
      isLoading: budgetsQuery.isLoading,
    }),
    [budgets, currentBudget, selectBudget, budgetsQuery.isLoading],
  )

  return <BudgetPeriodContext.Provider value={value}>{children}</BudgetPeriodContext.Provider>
}

export function useBudgetPeriod(): BudgetPeriodContextValue {
  const context = useContext(BudgetPeriodContext)
  if (!context) {
    throw new Error('useBudgetPeriod must be used within a BudgetPeriodProvider')
  }
  return context
}
