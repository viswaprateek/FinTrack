import { useEffect, useState } from 'react'
import { useUser, UserProfile } from '@clerk/clerk-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useCurrency } from '../../contexts/CurrencyContext'
import { SUPPORTED_CURRENCIES } from '../../lib/currencies'

export function SettingsPage() {
  const { user } = useUser()
  const { currency, updateCurrency, isLoading, isSaving } = useCurrency()
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <p className="mt-1 text-sm text-slate-500">Manage your account, preferences, and data.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Name</p>
              <p className="mt-1 text-sm text-slate-200">{user?.fullName ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</p>
              <p className="mt-1 text-sm text-slate-200">{user?.primaryEmailAddress?.emailAddress ?? '—'}</p>
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
            <label htmlFor="default-currency" className="mb-1.5 block text-sm font-medium text-slate-300">
              Default currency
            </label>
            <p className="mb-2 text-xs text-slate-500">
              Used to format amounts across the app and as the default for new budgets.
            </p>
            <select
              id="default-currency"
              className="w-full max-w-xs rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
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
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Default rollover type for new categories</label>
            <select className="w-full max-w-xs rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none">
              <option>Reset</option>
              <option>Rollover</option>
              <option>Capped</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Default budget name format</label>
            <select className="w-full max-w-xs rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none">
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
            <p className="text-sm font-medium text-slate-200">Delete all data</p>
            <p className="mt-1 text-sm text-slate-500">Permanently remove all budgets, transactions, and rules. This cannot be undone.</p>
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
                  card: 'bg-slate-900 border border-slate-800 shadow-xl shadow-black/30',
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
