import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApiClient, usersApi } from '../api'
import { DEFAULT_CURRENCY, formatCurrencyAmount } from '../lib/currencies'

interface CurrencyContextValue {
  currency: string
  formatCurrency: (amount: number) => string
  isLoading: boolean
  updateCurrency: (currency: string) => Promise<void>
  isSaving: boolean
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const client = useApiClient()
  const queryClient = useQueryClient()

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => usersApi.getMe(client),
  })

  const saveMutation = useMutation({
    mutationFn: (default_currency: string) => usersApi.updatePreferences(client, { default_currency }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })

  const currency = meQuery.data?.default_currency ?? DEFAULT_CURRENCY

  const updateCurrency = useCallback(
    async (nextCurrency: string) => {
      await saveMutation.mutateAsync(nextCurrency)
    },
    [saveMutation.mutateAsync],
  )

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      formatCurrency: (amount: number) => formatCurrencyAmount(amount, currency),
      isLoading: meQuery.isLoading,
      updateCurrency,
      isSaving: saveMutation.isPending,
    }),
    [currency, meQuery.isLoading, updateCurrency, saveMutation.isPending],
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
