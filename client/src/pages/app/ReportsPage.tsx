import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useApiClient, categoriesApi, expenseSharesApi } from '../../api'
import { useBudgetPeriod } from '../../contexts/BudgetPeriodContext'
import { useCurrency } from '../../contexts/CurrencyContext'
import { ContentLoader } from '../../components/ui/Spinner'
import { cn, formatShortDate } from '../../lib/utils'

const tabs = ['Spending by Category', 'Shared Expenses'] as const
type Tab = (typeof tabs)[number]

export function ReportsPage() {
  const client = useApiClient()
  const { formatCurrency } = useCurrency()
  const [tab, setTab] = useState<Tab>('Spending by Category')

  const { currentBudget, isLoading: budgetsLoading } = useBudgetPeriod()

  const categoriesQuery = useQuery({
    queryKey: ['categories', currentBudget?.id],
    queryFn: () => categoriesApi.listForBudget(client, currentBudget!.id),
    enabled: !!currentBudget,
  })
  const sharesQuery = useQuery({
    queryKey: ['expense-shares'],
    queryFn: () => expenseSharesApi.list(client),
  })
  const outstandingQuery = useQuery({
    queryKey: ['expense-shares', 'outstanding'],
    queryFn: () => expenseSharesApi.outstandingTotal(client),
  })

  const categories = categoriesQuery.data ?? []
  const shares = sharesQuery.data ?? []
  const outstanding = outstandingQuery.data?.total ?? 0

  const pageLoading =
    budgetsLoading || sharesQuery.isLoading || (!!currentBudget && categoriesQuery.isLoading)

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
                ? 'border-accent text-accent'
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
                      <td
                        className={cn(
                          'px-6 py-3.5 text-right font-semibold',
                          variance < 0 ? 'text-red-400' : 'text-success',
                        )}
                      >
                        {variance >= 0 ? '+' : ''}
                        {formatCurrency(variance)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {categories.length === 0 && (
              <p className="px-6 py-8 text-sm text-muted">No categories to report on yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'Shared Expenses' && (
        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Outstanding from friends</p>
            <p className="mt-2 text-2xl font-bold text-heading">{formatCurrency(outstanding)}</p>
            <Link to="/shared-expenses" className="mt-3 inline-block">
              <Button size="sm" variant="secondary">
                Manage shared expenses
              </Button>
            </Link>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All shared splits</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Description</th>
                    <th className="px-6 py-3 font-medium">Friends</th>
                    <th className="px-6 py-3 text-right font-medium">Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {shares.map((share) => {
                    const pending = share.participants
                      .filter((p) => p.status === 'pending')
                      .reduce((sum, p) => sum + p.amountOwed, 0)
                    return (
                      <tr key={share.id} className="border-b border-border/60 last:border-0">
                        <td className="px-6 py-3.5 text-muted-fg">{formatShortDate(share.transactionDate)}</td>
                        <td className="px-6 py-3.5 font-medium text-foreground">{share.description}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {share.participants.map((p) => (
                              <Badge key={p.id} tone={p.status === 'pending' ? 'warning' : 'success'}>
                                {p.email.split('@')[0]}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-right font-semibold text-foreground">
                          {formatCurrency(pending)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {shares.length === 0 && (
                <p className="px-6 py-8 text-sm text-muted">No shared expenses yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
