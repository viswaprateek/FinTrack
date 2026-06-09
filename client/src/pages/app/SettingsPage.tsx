import { useEffect, useState } from 'react'
import { useUser, UserProfile } from '@clerk/clerk-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useCurrency } from '../../contexts/CurrencyContext'
import { usePrivacy } from '../../contexts/PrivacyContext'
import { useTheme, type Theme } from '../../contexts/ThemeContext'
import { ActivityHeatmap } from '../../components/settings/ActivityHeatmap'
import { DummyBadges } from '../../components/settings/DummyBadges'
import { ContentLoader } from '../../components/ui/Spinner'
import { SUPPORTED_CURRENCIES } from '../../lib/currencies'
import { useClerkAppearance } from '../../lib/clerkAppearance'

export function SettingsPage() {
  const { user } = useUser()
  const { currency, updateCurrency, isLoading, isSaving } = useCurrency()
  const { privacyMode, setPrivacyMode } = usePrivacy()
  const { theme, setTheme } = useTheme()
  const clerkAppearance = useClerkAppearance()
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
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
            <div className="min-w-0 flex-1">
              <p className="mb-4 text-xs text-muted">
                Days you logged expenses — darker green means more transactions that day.
              </p>
              <ActivityHeatmap />
            </div>
            <div className="w-full shrink-0 lg:w-56 xl:w-64">
              <DummyBadges />
            </div>
          </div>
        </CardContent>
      </Card>

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
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface-muted/30 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-subtle">Privacy mode</p>
              <p className="mt-0.5 text-xs text-muted">
                Hide amounts on Goals and Cards — shown as ★ stars instead of numbers.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={privacyMode}
              onClick={() => setPrivacyMode(!privacyMode)}
              className={`relative h-7 w-11 shrink-0 overflow-hidden rounded-full transition-colors ${
                privacyMode ? 'bg-amber-500' : 'bg-border-muted'
              }`}
            >
              <span
                className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  privacyMode ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <div>
            <label htmlFor="theme" className="mb-1.5 block text-sm font-medium text-subtle">
              Appearance
            </label>
            <p className="mb-2 text-xs text-muted">
              Choose light or dark mode for the interface.
            </p>
            <select
              id="theme"
              className="w-full max-w-xs rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
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
              className="w-full max-w-xs rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
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
            <select className="w-full max-w-xs rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted">
              <option>Reset</option>
              <option>Rollover</option>
              <option>Capped</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-subtle">Default budget name format</label>
            <select className="w-full max-w-xs rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted">
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
            <UserProfile appearance={clerkAppearance} />
          </div>
        </div>
      )}
    </div>
  )
}
