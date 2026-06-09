import { Outlet } from 'react-router-dom'
import { BudgetPeriodProvider } from '../contexts/BudgetPeriodContext'
import { CurrencyProvider } from '../contexts/CurrencyContext'
import { PrivacyProvider } from '../contexts/PrivacyContext'

/** Shared providers for all authenticated app pages (inside OnboardingGate). */
export function AppProviders() {
  return (
    <PrivacyProvider>
      <CurrencyProvider>
        <BudgetPeriodProvider>
          <Outlet />
        </BudgetPeriodProvider>
      </CurrencyProvider>
    </PrivacyProvider>
  )
}
