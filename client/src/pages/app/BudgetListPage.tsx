import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { useApiClient, budgetsApi } from '../../api'
import { useCurrency } from '../../contexts/CurrencyContext'
import { MONTH_OPTIONS, monthlyBudgetPeriod } from '../../lib/budgets'
import { ContentLoader } from '../../components/ui/Spinner'
import { IconPlus } from '../../components/ui/icons'

export function BudgetListPage() {
  const client = useApiClient()
  const queryClient = useQueryClient()
  const { currency, formatCurrency } = useCurrency()
  const now = new Date()

  const [createOpen, setCreateOpen] = useState(false)
  const [customPeriod, setCustomPeriod] = useState(false)
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [name, setName] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [copyFromBudgetId, setCopyFromBudgetId] = useState('')
  const [copyEnvelopes, setCopyEnvelopes] = useState(true)

  const budgetsQuery = useQuery({ queryKey: ['budgets'], queryFn: () => budgetsApi.list(client) })
  const budgets = budgetsQuery.data ?? []

  const monthlyPreview = useMemo(() => monthlyBudgetPeriod(year, month), [year, month])

  const yearOptions = useMemo(() => {
    const y = now.getFullYear()
    return [y - 1, y, y + 1]
  }, [now])

  const createBudget = useMutation({
    mutationFn: () => {
      const payload = customPeriod
        ? { name, period_start: periodStart, period_end: periodEnd, currency }
        : {
            name: monthlyPreview.name,
            period_start: monthlyPreview.periodStart,
            period_end: monthlyPreview.periodEnd,
            currency,
          }
      return budgetsApi.create(client, {
        ...payload,
        copy_from_budget_id: copyEnvelopes && copyFromBudgetId ? copyFromBudgetId : null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      setCreateOpen(false)
    },
  })

  function openCreate() {
    setCustomPeriod(false)
    setMonth(now.getMonth() + 1)
    setYear(now.getFullYear())
    setName('')
    setPeriodStart('')
    setPeriodEnd('')
    setCopyFromBudgetId(budgets[0]?.id ?? '')
    setCopyEnvelopes(budgets.length > 0)
    setCreateOpen(true)
  }

  function submitCreate() {
    if (customPeriod && (!name || !periodStart || !periodEnd)) return
    createBudget.mutate()
  }

  if (budgetsQuery.isLoading) {
    return <ContentLoader label="Loading budgets…" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">My Budgets</h2>
          <p className="mt-1 text-sm text-slate-500">One budget per month — transactions stay within that period.</p>
        </div>
        <Button onClick={openCreate}>
          <IconPlus className="h-4 w-4" />
          New Monthly Budget
        </Button>
      </div>

      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => (
            <Card key={b.id} className="flex flex-col p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white">{b.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{b.period}</p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="text-slate-400">Planned</span>
                <span className="font-medium text-slate-200">{formatCurrency(b.plannedTotal)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-slate-400">Spent</span>
                <span className="font-medium text-slate-200">{formatCurrency(b.spentTotal)}</span>
              </div>
              <div className="mt-3">
                <ProgressBar value={b.spentTotal} max={b.plannedTotal} />
              </div>

              <div className="mt-6 flex items-center gap-2">
                <Link to={`/budgets/${b.id}`} className="flex-1">
                  <Button variant="primary" size="sm" className="w-full">
                    Open
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-sm font-medium text-slate-200">No budgets yet</p>
            <p className="mt-1 text-sm text-slate-500">Create this month&apos;s budget to start tracking.</p>
            <Button className="mt-4" onClick={openCreate}>
              <IconPlus className="h-4 w-4" />
              New Monthly Budget
            </Button>
          </CardContent>
        </Card>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setCreateOpen(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>New Monthly Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!customPeriod ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-300">Month</label>
                      <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                      >
                        {MONTH_OPTIONS.map((label, i) => (
                          <option key={label} value={i + 1}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-300">Year</label>
                      <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                      >
                        {yearOptions.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-800/40 px-4 py-3 text-sm">
                    <p className="font-medium text-slate-200">{monthlyPreview.name}</p>
                    <p className="mt-1 text-slate-500">
                      {monthlyPreview.periodStart} → {monthlyPreview.periodEnd}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">Name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      type="text"
                      placeholder="e.g. Q2 Project"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-300">Period start</label>
                      <input
                        value={periodStart}
                        onChange={(e) => setPeriodStart(e.target.value)}
                        type="date"
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-300">Period end</label>
                      <input
                        value={periodEnd}
                        onChange={(e) => setPeriodEnd(e.target.value)}
                        type="date"
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={() => setCustomPeriod((v) => !v)}
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
              >
                {customPeriod ? '← Use monthly budget' : 'Use custom period instead'}
              </button>

              {budgets.length > 0 && (
                <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-800/30 p-4">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={copyEnvelopes}
                      onChange={(e) => setCopyEnvelopes(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-300">Copy envelopes from previous budget</span>
                  </label>
                  {copyEnvelopes && (
                    <select
                      value={copyFromBudgetId}
                      onChange={(e) => setCopyFromBudgetId(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                    >
                      {budgets.map((b) => (
                        <option key={b.id} value={b.id}>{b.name} · {b.period}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              {createBudget.isError && (
                <p className="text-sm text-red-400">Failed to create budget. It may already exist for this month.</p>
              )}
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={submitCreate} disabled={createBudget.isPending}>
                  {createBudget.isPending ? 'Creating…' : 'Create Budget'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
