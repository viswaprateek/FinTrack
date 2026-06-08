import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useApiClient, categoriesApi, transactionsApi } from '../../api'
import { useBudgetPeriod } from '../../contexts/BudgetPeriodContext'
import { useCurrency } from '../../contexts/CurrencyContext'
import { ContentLoader } from '../../components/ui/Spinner'
import { cn, formatShortDate } from '../../lib/utils'

const tabs = ['Spending by Category', 'Reimbursements'] as const
type Tab = (typeof tabs)[number]

export function ReportsPage() {
  const client = useApiClient()
  const { formatCurrency } = useCurrency()
  const [tab, setTab] = useState<Tab>('Spending by Category')
  const [reimbursableFilter, setReimbursableFilter] = useState<'All' | 'Pending' | 'Received'>('All')

  const { currentBudget, isLoading: budgetsLoading } = useBudgetPeriod()

  const categoriesQuery = useQuery({
    queryKey: ['categories', currentBudget?.id],
    queryFn: () => categoriesApi.listForBudget(client, currentBudget!.id),
    enabled: !!currentBudget,
  })
  const transactionsQuery = useQuery({
    queryKey: ['transactions', { budgetId: currentBudget?.id }],
    queryFn: () => transactionsApi.list(client, { budget_id: currentBudget!.id }),
    enabled: !!currentBudget,
  })

  const categories = categoriesQuery.data ?? []
  const transactions = transactionsQuery.data ?? []

  const reimbursable = useMemo(() => transactions.filter((t) => t.reimbursable !== 'none'), [transactions])
  const filteredReimbursable = useMemo(
    () =>
      reimbursable.filter((t) => {
        if (reimbursableFilter === 'All') return true
        if (reimbursableFilter === 'Pending') return t.reimbursable === 'pending'
        return t.reimbursable === 'received'
      }),
    [reimbursable, reimbursableFilter],
  )
  const totalPending = reimbursable
    .filter((t) => t.reimbursable === 'pending')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const pageLoading =
    budgetsLoading ||
    transactionsQuery.isLoading ||
    (!!currentBudget && categoriesQuery.isLoading)

  if (pageLoading) {
    return <ContentLoader label="Loading reports…" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-heading">Reports & Forecasts</h2>
        <p className="mt-1 text-sm text-muted">Understand where your money is going — and where it's headed.</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === t
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-muted-fg hover:text-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Spending by Category' && (
        <Card>
          <CardHeader>
            <CardTitle>Planned vs Actual {currentBudget ? `— ${currentBudget.name}` : ''}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 text-right font-medium">Planned</th>
                  <th className="px-6 py-3 text-right font-medium">Actual</th>
                  <th className="px-6 py-3 text-right font-medium">Variance</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => {
                  const variance = c.planned - c.spent
                  return (
                    <tr key={c.id} className="border-b border-border/60 last:border-0">
                      <td className="px-6 py-3.5 font-medium text-foreground">{c.name}</td>
                      <td className="px-6 py-3.5 text-right text-muted-fg">{formatCurrency(c.planned)}</td>
                      <td className="px-6 py-3.5 text-right text-muted-fg">{formatCurrency(c.spent)}</td>
                      <td className={cn('px-6 py-3.5 text-right font-semibold', variance < 0 ? 'text-red-400' : 'text-emerald-400')}>
                        {variance >= 0 ? '+' : ''}
                        {formatCurrency(variance)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {categories.length === 0 && <p className="px-6 py-8 text-sm text-muted">No categories to report on yet.</p>}
          </CardContent>
        </Card>
      )}

      {tab === 'Reimbursements' && (
        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Total pending reimbursement</p>
            <p className="mt-2 text-2xl font-bold text-amber-400">{formatCurrency(totalPending)}</p>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reimbursable Transactions</CardTitle>
              <select
                value={reimbursableFilter}
                onChange={(e) => setReimbursableFilter(e.target.value as typeof reimbursableFilter)}
                className="rounded-xl border border-border-muted bg-input px-3 py-2 text-sm text-foreground focus:border-emerald-400 focus:outline-none"
              >
                <option>All</option>
                <option>Pending</option>
                <option>Received</option>
              </select>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Description</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReimbursable.map((t) => (
                    <tr key={t.id} className="border-b border-border/60 last:border-0">
                      <td className="px-6 py-3.5 text-muted-fg">{formatShortDate(t.date)}</td>
                      <td className="px-6 py-3.5 font-medium text-foreground">{t.description}</td>
                      <td className="px-6 py-3.5">
                        <Badge tone={t.reimbursable === 'pending' ? 'warning' : 'success'}>
                          {t.reimbursable === 'pending' ? 'Pending' : 'Received'}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold text-foreground">{formatCurrency(Math.abs(t.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredReimbursable.length === 0 && <p className="px-6 py-8 text-sm text-muted">No reimbursable transactions found.</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
