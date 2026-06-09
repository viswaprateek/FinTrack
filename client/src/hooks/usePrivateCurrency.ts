import { useCallback } from 'react'
import { useCurrency } from '../contexts/CurrencyContext'
import { usePrivacy } from '../contexts/PrivacyContext'
import { maskAmountStars, maskPercent } from '../lib/privacyDisplay'

/** Format amounts for display — stars when privacy mode is on. */
export function usePrivateCurrency() {
  const { formatCurrency } = useCurrency()
  const { privacyMode } = usePrivacy()

  const displayAmount = useCallback(
    (amount: number) => (privacyMode ? maskAmountStars(amount) : formatCurrency(amount)),
    [privacyMode, formatCurrency],
  )

  const displayPercent = useCallback(
    (value: number) => (privacyMode ? maskPercent() : `${Math.round(value)}%`),
    [privacyMode],
  )

  return { displayAmount, displayPercent, privacyMode }
}
