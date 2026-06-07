import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { ContentLoader } from '../../components/ui/Spinner'
import { useApiClient, budgetsApi, categoriesApi, incomeSourcesApi } from '../../api'
import { useCurrency } from '../../contexts/CurrencyContext'
import { cn } from '../../lib/utils'
import { IconArrowRight, IconPlus } from '../../components/ui/icons'
import type { IncomeSchedule } from '../../types'

const tabs = ['Overview', 'Income', 'Categories', 'Transactions'] as const
type Tab = (typeof tabs)[number]

const scheduleOptions: IncomeSchedule[] = ['weekly', 'biweekly', 'semimonthly', 'monthly', 'custom']

export function BudgetDetailPage() {
  const { id } = useParams()
  const budgetId = id!
  const client = useApiClient()
  const { formatCurrency } = useCurrency()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('Overview')

  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')

  const [incomeOpen, setIncomeOpen] = useState(false)
  const [incomeName, setIncomeName] = useState('')
  const [incomeAmount, setIncomeAmount] = useState('')
  const [incomeSchedule, setIncomeSchedule] = useState<IncomeSchedule>('monthly')

  const budgetQuery = useQuery({
    queryKey: ['budgets', budgetId],
    queryFn: () => budgetsApi.get(client, budgetId),
  })
  const categoriesQuery = useQuery({
    queryKey: ['categories', budgetId],
    queryFn: () => categoriesApi.listForBudget(client, budgetId),
  })
  const incomeSourcesQuery = useQuery({
    queryKey: ['income-sources', budgetId],
    queryFn: () => incomeSourcesApi.listForBudget(client, budgetId),
    enabled: tab === 'Income',
  })

  const updateBudget = useMutation({
    mutationFn: () => budgetsApi.update(client, budgetId, { name: editName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      setEditOpen(false)
    },
  })

  const createIncomeSource = useMutation({
    mutationFn: () =>
      incomeSourcesApi.create(client, budgetId, {
        name: incomeName,
        amount: Number(incomeAmount),
        schedule: incomeSchedule,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-sources', budgetId] })
      setIncomeOpen(false)
      setIncomeName('')
      setIncomeAmount('')
      setIncomeSchedule('monthly')
    },
  })

  const budget = budgetQuery.data
  const categories = categoriesQuery.data ?? []
  const incomeSources = incomeSourcesQuery.data ?? []

  if (budgetQuery.isLoading || categoriesQuery.isLoading) {
    return <ContentLoader label="Loading budget…" />
  }

  if (!budget) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-sm font-medium text-slate-200">Budget not found</p>
          <Link to="/budgets">
            <Button className="mt-4" variant="secondary">Back to budgets</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const remaining = budget.plannedTotal - budget.spentTotal

  function openEdit() {
    setEditName(budget!.name)
    setEditOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">{budget.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{budget.period}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={openEdit}>Edit</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === t
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Planned vs Actual</span>
              <span className="font-medium text-slate-200">
                {formatCurrency(budget.spentTotal)} of {formatCurrency(budget.plannedTotal)} spent
                <span className={cn('ml-2', remaining >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  ({remaining >= 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(Math.abs(remaining))} over`})
                </span>
              </span>
            </div>
            <div className="mt-3">
              <ProgressBar value={budget.spentTotal} max={budget.plannedTotal} />
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {categories.map((c) => (
                <div key={c.id}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-200">{c.name}</span>
                    <span className="text-slate-400">{formatCurrency(c.spent)} / {formatCurrency(c.planned)}</span>
                  </div>
                  <ProgressBar value={c.spent} max={c.planned} />
                </div>
              ))}
              {categories.length === 0 && <p className="text-sm text-slate-500">No categories yet for this budget.</p>}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'Income' && (
        <Card>
          <CardHeader>
            <CardTitle>Income Sources</CardTitle>
            <Button size="sm" onClick={() => setIncomeOpen(true)}>
              <IconPlus className="h-4 w-4" />
              Add Income Source
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {incomeSources.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl bg-slate-800/40 px-4 py-3.5">
                <div>
                  <p className="text-sm font-medium text-slate-200">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.schedule}</p>
                </div>
                <span className="text-sm font-semibold text-emerald-400">{formatCurrency(s.amount)}</span>
              </div>
            ))}
            {incomeSources.length === 0 && <p className="text-sm text-slate-500">No income sources yet.</p>}
          </CardContent>
        </Card>
      )}

      {tab === 'Categories' && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-sm text-slate-400">Manage envelopes and rollover rules for this budget.</p>
            <Link to={`/budgets/${budget.id}/categories`}>
              <Button>
                Open Categories
                <IconArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {tab === 'Transactions' && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-sm text-slate-400">View transactions filtered to this budget's period.</p>
            <Link to="/transactions">
              <Button>
                Open Transactions
                <IconArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setEditOpen(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Edit Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  type="text"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button onClick={() => updateBudget.mutate()} disabled={updateBudget.isPending || !editName}>
                  {updateBudget.isPending ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {incomeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setIncomeOpen(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Add Income Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Name</label>
                <input
                  value={incomeName}
                  onChange={(e) => setIncomeName(e.target.value)}
                  type="text"
                  placeholder="e.g. Salary — Acme Corp"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Amount</label>
                  <input
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(e.target.value)}
                    type="number"
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Schedule</label>
                  <select
                    value={incomeSchedule}
                    onChange={(e) => setIncomeSchedule(e.target.value as IncomeSchedule)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                  >
                    {scheduleOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="secondary" onClick={() => setIncomeOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => createIncomeSource.mutate()}
                  disabled={createIncomeSource.isPending || !incomeName || !incomeAmount}
                >
                  {createIncomeSource.isPending ? 'Saving…' : 'Add Income Source'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
