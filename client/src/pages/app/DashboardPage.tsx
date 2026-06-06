import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useApiClient, budgetsApi, categoriesApi, transactionsApi, recurringApi } from '../../api'
import { formatCurrency, formatShortDate } from '../../lib/utils'
import {
  IconWallet,
  IconTrendingUp,
  IconAlertTriangle,
  IconArrowRight,
  IconClock,
} from '../../components/ui/icons'

export function DashboardPage() {
  const client = useApiClient()

  const budgetsQuery = useQuery({ queryKey: ['budgets'], queryFn: () => budgetsApi.list(client) })
  const currentBudget = budgetsQuery.data?.[0]

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
  const upcomingBillsQuery = useQuery({
    queryKey: ['recurring-rules', 'upcoming', 7],
    queryFn: () => recurringApi.upcoming(client, 7),
  })

  const categories = categoriesQuery.data ?? []
  const transactions = transactionsQuery.data ?? []
  const upcomingBills = upcomingBillsQuery.data ?? []

  const plannedTotal = categories.reduce((sum, c) => sum + c.planned, 0)
  const spentTotal = categories.reduce((sum, c) => sum + c.spent, 0)
  const remaining = plannedTotal - spentTotal
  const overspentCount = categories.filter((c) => c.spent > c.planned).length

  if (!currentBudget && budgetsQuery.isLoading) {
    return <p className="text-sm text-slate-500">Loading dashboard…</p>
  }

  if (!currentBudget) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-sm font-medium text-slate-200">No budgets yet</p>
          <p className="mt-1 text-sm text-slate-500">Create your first budget to see your dashboard.</p>
          <Link to="/budgets">
            <Button className="mt-4">Go to Budgets</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Planned" value={formatCurrency(plannedTotal)} icon={<IconWallet className="h-5 w-5" />} />
        <StatCard label="Total Spent" value={formatCurrency(spentTotal)} icon={<IconTrendingUp className="h-5 w-5" />} tone="warning" />
        <StatCard label="Remaining" value={formatCurrency(remaining)} icon={<IconWallet className="h-5 w-5" />} tone="success" />
        <StatCard
          label="Overspent Categories"
          value={String(overspentCount)}
          icon={<IconAlertTriangle className="h-5 w-5" />}
          tone={overspentCount > 0 ? 'danger' : 'neutral'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Envelope summary */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Envelope Summary</CardTitle>
            <Link to={`/budgets/${currentBudget.id}/categories`}>
              <Button variant="ghost" size="sm">
                View all categories
                <IconArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-5">
            {categories.map((c) => {
              const overspent = c.spent > c.planned
              const available = c.planned - c.spent
              return (
                <div key={c.id}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-200">{c.name}</span>
                    <span className={overspent ? 'text-red-400' : 'text-slate-400'}>
                      {formatCurrency(c.spent)} / {formatCurrency(c.planned)}
                      <span className="ml-2 text-xs text-slate-500">
                        ({available >= 0 ? `${formatCurrency(available)} left` : `${formatCurrency(Math.abs(available))} over`})
                      </span>
                    </span>
                  </div>
                  <ProgressBar value={c.spent} max={c.planned} />
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Bills</CardTitle>
              <Badge tone="info">Next 7 days</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between rounded-xl bg-slate-800/40 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                      <IconClock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{bill.name}</p>
                      <p className="text-xs text-slate-500">Due {formatShortDate(bill.dueDate)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-200">{formatCurrency(bill.amount)}</span>
                </div>
              ))}
              {upcomingBills.length === 0 && <p className="text-sm text-slate-500">Nothing due in the next 7 days.</p>}
            </CardContent>
          </Card>

          {remaining < 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="flex items-start gap-3 py-5">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <IconAlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-300">Cashflow risk alert</p>
                  <p className="mt-1 text-sm text-slate-400">
                    You've spent <span className="text-slate-200">{formatCurrency(Math.abs(remaining))}</span> more than
                    planned this period.
                  </p>
                  <Link to="/reports" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-amber-400 hover:text-amber-300">
                    View forecast <IconArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <Link to="/transactions">
            <Button variant="ghost" size="sm">
              View all transactions
              <IconArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 5).map((t) => (
                <tr key={t.id} className="border-b border-slate-800/60 last:border-0">
                  <td className="px-6 py-3.5 text-slate-400">{formatShortDate(t.date)}</td>
                  <td className="px-6 py-3.5 font-medium text-slate-200">{t.description}</td>
                  <td className="px-6 py-3.5">
                    <Badge>{t.category}</Badge>
                  </td>
                  <td className={`px-6 py-3.5 text-right font-semibold ${t.amount >= 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {t.amount >= 0 ? '+' : ''}
                    {formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
