import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { useApiClient, budgetsApi } from '../api'
import { budgetForDate } from '../lib/budgets'
import { readStoredBudgetId, writeStoredBudgetId } from '../lib/budgetStorage'
import type { Budget } from '../types'

interface BudgetPeriodContextValue {
  budgets: Budget[]
  currentBudget: Budget | null
  selectBudget: (id: string) => void
  isLoading: boolean
}

export const BudgetPeriodContext = createContext<BudgetPeriodContextValue | null>(null)

export function BudgetPeriodProvider({ children }: { children: ReactNode }) {
  const client = useApiClient()
  const queryClient = useQueryClient()
  const { pathname } = useLocation()
  const onDashboard = pathname === '/dashboard'

  const budgetsQuery = useQuery({
    queryKey: ['budgets'],
    queryFn: () => budgetsApi.list(client),
    staleTime: 5 * 60_000,
    // Dashboard hydrates budgets via GET /api/dashboard — skip duplicate fetch.
    enabled: !onDashboard,
  })
  const budgets =
    queryClient.getQueryData<Budget[]>(['budgets']) ?? budgetsQuery.data ?? []

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
    writeStoredBudgetId(id)
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
