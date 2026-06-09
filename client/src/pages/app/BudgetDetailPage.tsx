import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CategoryIcon } from '../../components/categories/CategoryIcon'
import { TransactionListItem } from '../../components/transactions/TransactionListItem'
import { Badge } from '../../components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { ContentLoader } from '../../components/ui/Spinner'
import { useApiClient, budgetsApi, categoriesApi, incomeSourcesApi, transactionsApi } from '../../api'
import { useBudgetPeriod } from '../../contexts/BudgetPeriodContext'
import { useCurrency } from '../../contexts/CurrencyContext'
import { cn } from '../../lib/utils'
import { IconArrowRight, IconPlus } from '../../components/ui/icons'
import type { IncomeSchedule, RolloverType } from '../../types'

const rolloverTone: Record<RolloverType, 'neutral' | 'success' | 'info'> = {
  reset: 'neutral',
  rollover: 'success',
  capped: 'info',
}

const tabs = ['Overview', 'Income', 'Categories', 'Transactions'] as const
type Tab = (typeof tabs)[number]

const scheduleOptions: IncomeSchedule[] = ['weekly', 'biweekly', 'semimonthly', 'monthly', 'custom']

export function BudgetDetailPage() {
  const { id } = useParams()
  const budgetId = id!
  const client = useApiClient()
  const { formatCurrency } = useCurrency()
  const { selectBudget } = useBudgetPeriod()
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
  const libraryQuery = useQuery({
    queryKey: ['category-library'],
    queryFn: () => categoriesApi.listAll(client),
    enabled: tab === 'Categories',
  })
  const transactionsQuery = useQuery({
    queryKey: ['transactions', { budgetId }],
    queryFn: () => transactionsApi.list(client, { budget_id: budgetId }),
    enabled: tab === 'Transactions',
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
  const library = libraryQuery.data ?? []
  const transactions = useMemo(
    () => [...(transactionsQuery.data ?? [])].sort((a, b) => b.date.localeCompare(a.date)),
    [transactionsQuery.data],
  )

  function openCategoriesPage() {
    selectBudget(budgetId)
  }

  function openTransactionsPage() {
    selectBudget(budgetId)
  }

  if (budgetQuery.isLoading || categoriesQuery.isLoading) {
    return <ContentLoader label="Loading budget…" />
  }

  if (!budget) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-sm font-medium text-foreground">Budget not found</p>
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
          <h2 className="text-xl font-semibold text-heading">{budget.name}</h2>
          <p className="mt-1 text-sm text-muted">{budget.period}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={openEdit}>Edit</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === t
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-fg hover:text-foreground',
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
              <span className="text-muted-fg">Planned vs Actual</span>
              <span className="font-medium text-foreground">
                {formatCurrency(budget.spentTotal)} of {formatCurrency(budget.plannedTotal)} spent
                <span className={cn('ml-2', remaining >= 0 ? 'text-success' : 'text-red-400')}>
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
                    <span className="font-medium text-foreground">{c.name}</span>
                    <span className="text-muted-fg">{formatCurrency(c.spent)} / {formatCurrency(c.planned)}</span>
                  </div>
                  <ProgressBar value={c.spent} max={c.planned} />
                </div>
              ))}
              {categories.length === 0 && <p className="text-sm text-muted">No categories yet for this budget.</p>}
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
              <div key={s.id} className="flex items-center justify-between rounded-xl bg-input/40 px-4 py-3.5">
                <div>
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  <p className="text-xs text-muted">{s.schedule}</p>
                </div>
                <span className="text-sm font-semibold text-success">{formatCurrency(s.amount)}</span>
              </div>
            ))}
            {incomeSources.length === 0 && <p className="text-sm text-muted">No income sources yet.</p>}
          </CardContent>
        </Card>
      )}

      {tab === 'Categories' && (
        <Card>
          <CardHeader>
            <CardTitle>Envelopes</CardTitle>
            <Link to="/categories" onClick={openCategoriesPage}>
              <Button variant="secondary" size="sm">
                Manage
                <IconArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {libraryQuery.isLoading ? (
              <p className="px-6 py-8 text-sm text-muted">Loading categories…</p>
            ) : categories.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-6 py-3 font-medium">Category</th>
                    <th className="px-6 py-3 font-medium">Planned</th>
                    <th className="px-6 py-3 font-medium">Spent</th>
                    <th className="px-6 py-3 font-medium">Available</th>
                    <th className="px-6 py-3 font-medium">Rollover</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => {
                    const available = c.planned - c.spent
                    const libItem = library.find((l) => l.id === c.id)
                    return (
                      <tr key={c.id} className="border-b border-border/60 last:border-0">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2 font-medium text-foreground">
                            <CategoryIcon name={c.name} icon={libItem?.icon} size="sm" />
                            {c.name}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-muted-fg">{formatCurrency(c.planned)}</td>
                        <td className="px-6 py-3.5 text-muted-fg">{formatCurrency(c.spent)}</td>
                        <td
                          className={cn(
                            'px-6 py-3.5 font-medium',
                            available < 0 ? 'text-red-400' : 'text-success',
                          )}
                        >
                          {formatCurrency(available)}
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge tone={rolloverTone[c.rolloverType]}>
                            {c.rolloverType}
                            {c.rolloverType === 'capped' && c.rolloverCap
                              ? ` · cap ${formatCurrency(c.rolloverCap)}`
                              : ''}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-muted">No envelopes for this month yet.</p>
                <Link to="/categories" onClick={openCategoriesPage} className="mt-3 inline-block">
                  <Button size="sm">Add categories</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'Transactions' && (
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <Link to="/transactions" onClick={openTransactionsPage}>
              <Button variant="secondary" size="sm">
                Add &amp; edit
                <IconArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {transactionsQuery.isLoading ? (
              <p className="text-sm text-muted">Loading transactions…</p>
            ) : transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((t) => (
                  <TransactionListItem
                    key={t.id}
                    transaction={t}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-muted">No transactions for this month yet.</p>
                <Link to="/transactions" onClick={openTransactionsPage} className="mt-3 inline-block">
                  <Button size="sm">Add transaction</Button>
                </Link>
              </div>
            )}
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
                <label className="mb-1.5 block text-sm font-medium text-subtle">Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  type="text"
                  className="w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
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
                <label className="mb-1.5 block text-sm font-medium text-subtle">Name</label>
                <input
                  value={incomeName}
                  onChange={(e) => setIncomeName(e.target.value)}
                  type="text"
                  placeholder="e.g. Salary — Acme Corp"
                  className="w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-subtle">Amount</label>
                  <input
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(e.target.value)}
                    type="number"
                    placeholder="0.00"
                    className="w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-subtle">Schedule</label>
                  <select
                    value={incomeSchedule}
                    onChange={(e) => setIncomeSchedule(e.target.value as IncomeSchedule)}
                    className="w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
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
