import { useEffect, useState } from 'react'
import { useUser, UserProfile } from '@clerk/clerk-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useCurrency } from '../../contexts/CurrencyContext'
import { useTheme, type Theme } from '../../contexts/ThemeContext'
import { ContentLoader } from '../../components/ui/Spinner'
import { SUPPORTED_CURRENCIES } from '../../lib/currencies'

export function SettingsPage() {
  const { user } = useUser()
  const { currency, updateCurrency, isLoading, isSaving } = useCurrency()
  const { theme, setTheme } = useTheme()
  const [profileOpen, setProfileOpen] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState(currency)

  useEffect(() => {
    setSelectedCurrency(currency)
  }, [currency])

  async function savePreferences() {
    if (selectedCurrency === currency) return
    await updateCurrency(selectedCurrency)
  }

  const currencyDirty = selectedCurrency !== currency

  if (isLoading) {
    return <ContentLoader label="Loading settings…" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-heading">Settings</h2>
        <p className="mt-1 text-sm text-muted">Manage your account, preferences, and data.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Name</p>
              <p className="mt-1 text-sm text-foreground">{user?.fullName ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Email</p>
              <p className="mt-1 text-sm text-foreground">{user?.primaryEmailAddress?.emailAddress ?? '—'}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setProfileOpen(true)}>
            Manage Account
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="theme" className="mb-1.5 block text-sm font-medium text-subtle">
              Appearance
            </label>
            <p className="mb-2 text-xs text-muted">
              Choose light or dark mode for the interface.
            </p>
            <select
              id="theme"
              className="w-full max-w-xs rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-emerald-400 focus:outline-none"
              value={theme}
              onChange={(e) => setTheme(e.target.value as Theme)}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div>
            <label htmlFor="default-currency" className="mb-1.5 block text-sm font-medium text-subtle">
              Default currency
            </label>
            <p className="mb-2 text-xs text-muted">
              Used to format amounts across the app.
            </p>
            <select
              id="default-currency"
              className="w-full max-w-xs rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-emerald-400 focus:outline-none"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              disabled={isLoading || isSaving}
            >
              {SUPPORTED_CURRENCIES.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-subtle">Default rollover type for new categories</label>
            <select className="w-full max-w-xs rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-emerald-400 focus:outline-none">
              <option>Reset</option>
              <option>Rollover</option>
              <option>Capped</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-subtle">Default budget name format</label>
            <select className="w-full max-w-xs rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-emerald-400 focus:outline-none">
              <option>Month Year — e.g. June 2026</option>
              <option>MM/YYYY — e.g. 06/2026</option>
            </select>
          </div>
          <Button size="sm" onClick={savePreferences} disabled={!currencyDirty || isSaving || isLoading}>
            {isSaving ? 'Saving…' : 'Save Preferences'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Delete all data</p>
            <p className="mt-1 text-sm text-muted">Permanently remove all budgets, transactions, and rules. This cannot be undone.</p>
          </div>
          <Button variant="danger" size="sm">Delete all data</Button>
        </CardContent>
      </Card>

      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-8" onClick={() => setProfileOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <UserProfile
              appearance={{
                elements: {
                  rootBox: 'mx-auto',
                  card: 'bg-surface-solid border border-border shadow-xl shadow-black/30',
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
