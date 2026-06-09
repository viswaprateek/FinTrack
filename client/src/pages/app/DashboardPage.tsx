import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { ContentLoader } from '../../components/ui/Spinner'
import { useInitialLoading } from '../../hooks/useInitialLoading'
import { StatCard } from '../../components/ui/StatCard'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useApiClient, categoriesApi, expenseSharesApi, incomeSourcesApi, transactionsApi, recurringApi } from '../../api'
import { useBudgetPeriod } from '../../contexts/BudgetPeriodContext'
import { useCurrency } from '../../contexts/CurrencyContext'
import { formatShortDate } from '../../lib/utils'
import { AddTransactionModal } from '../../components/transactions/AddTransactionModal'
import { TransactionListItem } from '../../components/transactions/TransactionListItem'
import type { Transaction, Category } from '../../types'
import {
  IconWallet,
  IconTrendingUp,
  IconAlertTriangle,
  IconArrowRight,
  IconClock,
  IconShield,
  IconSparkles,
  IconZap,
  IconPlus,
} from '../../components/ui/icons'
import { CHART_COLORS, useChartTheme } from '../../lib/chartTheme'

// ─── Data helpers ─────────────────────────────────────────────────────────────

function toNum(value: number | string | null | undefined): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function buildSpendingTrend(
  transactions: Transaction[],
  periodStart: string,
  periodEnd: string,
) {
  const byDate = new Map<string, number>()
  const hasPeriod = Boolean(periodStart && periodEnd)
  transactions
    .filter((t) => {
      const day = t.date.substring(0, 10)
      const inPeriod = !hasPeriod || (day >= periodStart && day <= periodEnd)
      return toNum(t.amount) < 0 && inPeriod
    })
    .forEach((t) => {
      const day = t.date.substring(0, 10)
      byDate.set(day, (byDate.get(day) || 0) + Math.abs(toNum(t.amount)))
    })
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, spending]) => ({
      date: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      spending: Math.round(spending * 100) / 100,
    }))
}

/** Group all budget transactions by category — includes uncategorized and categories without envelopes. */
function buildCategoryPieFromTransactions(transactions: Transaction[]) {
  const byCategory = new Map<string, number>()
  transactions
    .filter((t) => toNum(t.amount) < 0)
    .forEach((t) => {
      const name = t.category?.trim() || 'Uncategorized'
      byCategory.set(name, (byCategory.get(name) || 0) + Math.abs(toNum(t.amount)))
    })

  const spentTotal = [...byCategory.values()].reduce((sum, v) => sum + v, 0)
  const slices = [...byCategory.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
      pct: spentTotal > 0 ? Math.round((value / spentTotal) * 100) : 0,
    }))

  return { slices, spentTotal }
}

function buildBudgetVsActual(categories: Category[]) {
  return categories
    .sort((a, b) => toNum(b.planned) - toNum(a.planned))
    .slice(0, 6)
    .map((c) => ({
      name: c.name.length > 13 ? c.name.substring(0, 13) + '…' : c.name,
      Planned: Math.round(toNum(c.planned) * 100) / 100,
      Spent: Math.round(toNum(c.spent) * 100) / 100,
    }))
}

function getBudgetHealth(spent: number, planned: number) {
  if (planned <= 0) return { score: 100, label: 'No Budget Set', color: 'slate' as const }
  const pct = (spent / planned) * 100
  if (pct >= 100) return { score: 0, label: 'Over Budget', color: 'red' as const }
  if (pct >= 85) return { score: Math.round(100 - pct), label: 'At Risk', color: 'amber' as const }
  return { score: Math.round(100 - pct), label: 'On Track', color: 'emerald' as const }
}

function getSpendingVelocity(transactions: Transaction[], plannedTotal: number) {
  const expenses = transactions.filter((t) => toNum(t.amount) < 0)
  if (expenses.length < 1 || plannedTotal === 0) return null
  const dates = expenses.map((t) => t.date.substring(0, 10)).sort()
  const earliest = new Date(dates[0] + 'T00:00:00')
  const latest = new Date(dates[dates.length - 1] + 'T00:00:00')
  const daySpan = Math.max(1, Math.round((latest.getTime() - earliest.getTime()) / 86400000) + 1)
  const totalSpent = expenses.reduce((sum, t) => sum + Math.abs(toNum(t.amount)), 0)
  const dailyRate = totalSpent / daySpan
  const projectedMonthly = dailyRate * 30
  return { dailyRate, projectedMonthly, onTrack: projectedMonthly <= plannedTotal }
}

// ─── Custom Tooltips ──────────────────────────────────────────────────────────

const tooltipBox = 'rounded-lg border border-border bg-surface-solid px-3 py-2 shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/[0.06]'

function SpendingTooltip({ active, payload, label, formatCurrency }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string; formatCurrency: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className={tooltipBox}>
      <p className="text-xs font-medium text-muted-fg">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-heading">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

function BarTooltip({ active, payload, label, formatCurrency }: {
  active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string; formatCurrency: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className={tooltipBox}>
      <p className="mb-1.5 text-xs font-medium text-subtle">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-fg">{p.name}:</span>
          <span className="font-semibold text-foreground">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload, formatCurrency }: {
  active?: boolean; payload?: Array<{ name: string; value: number; payload: { pct: number } }>; formatCurrency: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className={tooltipBox}>
      <p className="text-xs font-medium text-subtle">{payload[0].name}</p>
      <p className="mt-0.5 text-sm font-semibold text-heading">{formatCurrency(payload[0].value)}</p>
      <p className="text-xs text-muted">{payload[0].payload.pct}% of spending</p>
    </div>
  )
}

// ─── Health badge ─────────────────────────────────────────────────────────────

const healthStyles = {
  emerald: { badge: 'bg-success-muted border-success/20 text-success', dot: 'bg-success' },
  amber:   { badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400',     dot: 'bg-amber-400'   },
  red:     { badge: 'bg-danger-muted border-danger/20 text-danger',           dot: 'bg-danger'     },
  slate:   { badge: 'bg-surface-muted border-border text-muted-fg',     dot: 'bg-muted'   },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const client = useApiClient()
  const { formatCurrency } = useCurrency()
  const { currentBudget, isLoading: budgetsLoading } = useBudgetPeriod()
  const chartTheme = useChartTheme()
  const [addTransactionOpen, setAddTransactionOpen] = useState(false)

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
  const incomeSourcesQuery = useQuery({
    queryKey: ['income-sources', currentBudget?.id],
    queryFn: () => incomeSourcesApi.listForBudget(client, currentBudget!.id),
    enabled: !!currentBudget,
  })
  const friendsOweQuery = useQuery({
    queryKey: ['expense-shares', 'outstanding'],
    queryFn: () => expenseSharesApi.outstandingTotal(client),
  })
  const youOweQuery = useQuery({
    queryKey: ['expense-shares', 'owed-total'],
    queryFn: () => expenseSharesApi.owedTotal(client),
  })

  const categories = categoriesQuery.data ?? []
  const transactions = transactionsQuery.data ?? []
  const upcomingBills = upcomingBillsQuery.data ?? []

  const plannedTotal  = categories.reduce((sum, c) => sum + toNum(c.planned), 0)
  const envelopeSpent = categories.reduce((sum, c) => sum + toNum(c.spent), 0)
  const uncategorizedSpent = transactions
    .filter((t) => toNum(t.amount) < 0 && (t.category === 'Uncategorized' || !t.category?.trim()))
    .reduce((sum, t) => sum + Math.abs(toNum(t.amount)), 0)
  const spentTotal = envelopeSpent + uncategorizedSpent
  const categoryPieData = buildCategoryPieFromTransactions(transactions)
  const remaining     = plannedTotal - spentTotal
  const overspentCategories = categories.filter((c) => toNum(c.spent) > toNum(c.planned))
  const savingsRate   = plannedTotal > 0 ? Math.max(0, Math.round(((plannedTotal - spentTotal) / plannedTotal) * 100)) : 0
  const friendsOweTotal = friendsOweQuery.data?.total ?? 0
  const youOweTotal = youOweQuery.data?.total ?? 0
  const incomeSources = incomeSourcesQuery.data ?? []
  const expectedIncome = incomeSources.reduce((sum, s) => sum + toNum(s.amount), 0)
  const actualIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const periodProgress = useMemo(() => {
    if (!currentBudget) return null
    const start = new Date(`${currentBudget.periodStart}T00:00:00`)
    const end = new Date(`${currentBudget.periodEnd}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const totalDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
    const dayNum = Math.min(
      totalDays,
      Math.max(1, Math.round((today.getTime() - start.getTime()) / 86_400_000) + 1),
    )
    return { dayNum, totalDays, pct: Math.round((dayNum / totalDays) * 100) }
  }, [currentBudget])

  const health         = getBudgetHealth(spentTotal, plannedTotal)
  const velocity       = getSpendingVelocity(transactions, plannedTotal)
  const spendingTrend  = buildSpendingTrend(
    transactions,
    currentBudget?.periodStart ?? '',
    currentBudget?.periodEnd ?? '',
  )
  const categoryPie    = categoryPieData.slices
  const budgetVsActual = buildBudgetVsActual(categories)
  const hc             = healthStyles[health.color]

  const formatY = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v)))

  const pageLoading = useInitialLoading([
    { isLoading: budgetsLoading },
    ...(currentBudget ? [categoriesQuery, transactionsQuery] : []),
  ])

  if (pageLoading) return <ContentLoader label="Loading dashboard…" />

  if (!currentBudget) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-sm font-medium text-foreground">No budgets yet</p>
          <p className="mt-1 text-sm text-muted">Create your first budget to see your dashboard.</p>
          <Link to="/budgets">
            <Button className="mt-4">Go to Budgets</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {periodProgress && (
            <div className="max-w-xs">
              <div className="mb-1 flex items-center justify-between text-xs text-muted">
                <span>Day {periodProgress.dayNum} of {periodProgress.totalDays}</span>
                <span>{periodProgress.pct}%</span>
              </div>
              <ProgressBar value={periodProgress.dayNum} max={periodProgress.totalDays} />
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 sm:px-4 ${hc.badge}`}>
            <span className={`h-2 w-2 rounded-full ${hc.dot}`} />
            <span className="text-sm font-medium">{health.label}</span>
            <span className="hidden text-xs text-muted sm:inline">{health.score}% remaining</span>
          </div>
          <Button size="sm" onClick={() => setAddTransactionOpen(true)}>
            <IconPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Transaction</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* ── Stat cards — horizontal scroll on mobile ─────────────────────────── */}
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0 xl:grid-cols-6">
        {[
          {
            label: 'Total Budget',
            value: formatCurrency(plannedTotal),
            subLabel: 'This period',
            icon: <IconWallet className="h-5 w-5" />,
            iconColor: 'text-blue-400',
            iconBg: 'bg-blue-500/10',
          },
          {
            label: 'Total Spent',
            value: formatCurrency(spentTotal),
            subLabel:
              uncategorizedSpent > 0
                ? `${formatCurrency(uncategorizedSpent)} uncategorized`
                : plannedTotal > 0
                  ? `${Math.round((spentTotal / plannedTotal) * 100)}% of budget`
                  : undefined,
            icon: <IconTrendingUp className="h-5 w-5" />,
            iconColor: 'text-amber-400',
            iconBg: 'bg-amber-500/10',
            tone: spentTotal > plannedTotal ? ('danger' as const) : ('warning' as const),
          },
          {
            label: 'Remaining',
            value: formatCurrency(Math.abs(remaining)),
            subLabel: remaining < 0 ? 'Overspent' : 'Available',
            icon: <IconShield className="h-5 w-5" />,
            iconColor: remaining >= 0 ? 'text-success' : 'text-danger',
            iconBg: remaining >= 0 ? 'bg-success-muted' : 'bg-danger-muted',
            tone: remaining >= 0 ? ('success' as const) : ('danger' as const),
          },
          {
            label: 'Income',
            value: formatCurrency(actualIncome),
            subLabel:
              expectedIncome > 0
                ? `${formatCurrency(expectedIncome)} expected`
                : incomeSources.length === 0
                  ? 'No sources set'
                  : undefined,
            icon: <IconTrendingUp className="h-5 w-5" />,
            iconColor: 'text-success',
            iconBg: 'bg-success-muted',
            tone: expectedIncome > 0 && actualIncome >= expectedIncome ? ('success' as const) : ('neutral' as const),
          },
          {
            label: 'Savings Rate',
            value: `${savingsRate}%`,
            subLabel: savingsRate >= 20 ? 'Great job!' : savingsRate >= 10 ? 'Keep going' : 'Under target',
            icon: <IconSparkles className="h-5 w-5" />,
            iconColor: 'text-purple-400',
            iconBg: 'bg-purple-500/10',
            tone: savingsRate >= 20 ? ('success' as const) : savingsRate >= 0 ? ('neutral' as const) : ('danger' as const),
          },
          {
            label: 'Over Budget',
            value: String(overspentCategories.length),
            subLabel:
              overspentCategories.length === 0
                ? 'All envelopes ok'
                : `Envelope${overspentCategories.length > 1 ? 's' : ''} over`,
            icon: <IconAlertTriangle className="h-5 w-5" />,
            iconColor: overspentCategories.length > 0 ? 'text-red-400' : 'text-muted-fg',
            iconBg: overspentCategories.length > 0 ? 'bg-red-500/10' : 'bg-input',
            tone: overspentCategories.length > 0 ? ('danger' as const) : ('neutral' as const),
          },
        ].map((stat) => (
          <div key={stat.label} className="min-w-[9.5rem] shrink-0 snap-start sm:min-w-[10.5rem] lg:min-w-0">
            <StatCard compact {...stat} />
          </div>
        ))}
      </div>

      {/* ── Charts row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Spending trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Spending Trend</CardTitle>
            <span className="text-xs text-muted">
              Daily spending · {currentBudget.period}
            </span>
          </CardHeader>
          <CardContent>
            {spendingTrend.length > 0 ? (
              <ResponsiveContainer key={`spending-${currentBudget.id}`} width="100%" height={220}>
                <AreaChart data={spendingTrend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={chartTheme.accent} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={chartTheme.accent} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: chartTheme.axis, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: chartTheme.axis, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatY}
                    width={42}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => (
                      <SpendingTooltip
                        active={active}
                        payload={payload as unknown as Array<{ value: number }>}
                        label={label as string}
                        formatCurrency={formatCurrency}
                      />
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="spending"
                    stroke={chartTheme.accent}
                    strokeWidth={2.5}
                    fill="url(#spendGrad)"
                    dot={{ fill: chartTheme.accent, r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: chartTheme.accent, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-muted">
                <IconTrendingUp className="h-8 w-8 opacity-30" />
                <p className="text-sm">Add transactions to see your spending trend</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category donut */}
        <Card>
          <CardHeader>
            <CardTitle>By Category</CardTitle>
            <span className="text-xs text-muted">Spending split</span>
          </CardHeader>
          <CardContent>
            {categoryPie.length > 0 ? (
              <>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie
                        data={categoryPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {categoryPie.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => (
                          <PieTooltip
                            active={active}
                            payload={payload as unknown as Array<{ name: string; value: number; payload: { pct: number } }>}
                            formatCurrency={formatCurrency}
                          />
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted">Spent</p>
                    <p className="text-base font-bold text-foreground">{formatCurrency(spentTotal)}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {categoryPie.slice(0, 4).map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="truncate text-muted-fg">{d.name}</span>
                      </div>
                      <span className="ml-2 shrink-0 font-medium text-subtle">{d.pct}%</span>
                    </div>
                  ))}
                  {categoryPie.length > 4 && (
                    <p className="text-xs text-muted">+{categoryPie.length - 4} more categories</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-muted">
                <IconWallet className="h-8 w-8 opacity-30" />
                <p className="text-sm">No spending data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Budget vs Actual + Right column ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

        {/* Budget vs Actual */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Budget vs Actual</CardTitle>
            <Link to="/categories">
              <Button variant="ghost" size="sm">
                All categories
                <IconArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {budgetVsActual.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={budgetVsActual} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: chartTheme.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: chartTheme.axis, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatY} width={42} />
                  <Tooltip
                    content={({ active, payload, label }) => (
                      <BarTooltip
                        active={active}
                        payload={payload as unknown as Array<{ name: string; value: number; color: string }>}
                        label={label as string}
                        formatCurrency={formatCurrency}
                      />
                    )}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: chartTheme.legend, paddingTop: '12px' }} />
                  <Bar dataKey="Planned" fill={chartTheme.secondary} radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="Spent"   fill={chartTheme.accent} radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-muted">
                <p className="text-sm">No category data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-4 lg:col-span-2">

          {/* Upcoming bills */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Bills</CardTitle>
              <Badge tone="info">Next 7 days</Badge>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {upcomingBills.length > 0 ? (
                upcomingBills.map((bill) => {
                  const daysUntil = Math.ceil(
                    (new Date(bill.dueDate).getTime() - Date.now()) / 86400000,
                  )
                  const isUrgent = daysUntil <= 2
                  return (
                    <div
                      key={bill.id}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-3 ${
                        isUrgent
                          ? 'border border-red-500/15 bg-red-500/5'
                          : 'bg-input/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            isUrgent ? 'bg-red-500/10 text-red-400' : 'bg-input text-muted-fg'
                          }`}
                        >
                          <IconClock className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{bill.name}</p>
                          <p className={`text-xs ${isUrgent ? 'text-red-400' : 'text-muted'}`}>
                            {daysUntil <= 0
                              ? 'Due today'
                              : daysUntil === 1
                                ? 'Due tomorrow'
                                : `Due ${formatShortDate(bill.dueDate)}`}
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold ${isUrgent ? 'text-red-300' : 'text-foreground'}`}>
                        {formatCurrency(bill.amount)}
                      </span>
                    </div>
                  )
                })
              ) : (
                <p className="py-4 text-center text-sm text-muted">Nothing due in the next 7 days.</p>
              )}
            </CardContent>
          </Card>

          {/* Quick metrics */}
          <div className="space-y-3">
            {friendsOweTotal > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
                <div>
                  <p className="text-xs font-medium text-blue-400">Friends owe you</p>
                  <p className="mt-0.5 text-lg font-bold text-blue-300">{formatCurrency(friendsOweTotal)}</p>
                </div>
                <Link to="/shared-expenses" className="text-xs font-medium text-blue-400 hover:text-blue-300">
                  View →
                </Link>
              </div>
            )}

            {youOweTotal > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <div>
                  <p className="text-xs font-medium text-amber-400">You owe friends</p>
                  <p className="mt-0.5 text-lg font-bold text-amber-300">{formatCurrency(youOweTotal)}</p>
                </div>
                <Link
                  to="/shared-expenses?tab=owed"
                  className="text-xs font-medium text-amber-400 hover:text-amber-300"
                >
                  View →
                </Link>
              </div>
            )}

            {velocity && (
              <div className="flex items-center justify-between rounded-xl border border-border-muted/60 bg-input/40 px-4 py-3">
                <div>
                  <p className="text-xs font-medium text-muted-fg">Daily Spend Rate</p>
                  <p className="mt-0.5 text-lg font-bold text-foreground">{formatCurrency(velocity.dailyRate)}/day</p>
                  <p className={`text-xs ${velocity.onTrack ? 'text-success' : 'text-amber-400'}`}>
                    Projected: {formatCurrency(velocity.projectedMonthly)}/mo
                  </p>
                </div>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    velocity.onTrack ? 'bg-success-muted text-success' : 'bg-amber-500/10 text-amber-400'
                  }`}
                >
                  <IconZap className="h-4 w-4" />
                </div>
              </div>
            )}

            {remaining < 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <IconAlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-300">Cashflow risk</p>
                  <p className="mt-0.5 text-xs text-muted-fg">
                    {formatCurrency(Math.abs(remaining))} over plan
                  </p>
                  <Link
                    to="/reports"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300"
                  >
                    View forecast <IconArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Overspent envelopes ─────────────────────────────────────────────── */}
      {overspentCategories.length > 0 && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-red-400">
              Over Budget — {overspentCategories.length} Envelope{overspentCategories.length > 1 ? 's' : ''}
            </CardTitle>
            <Link to="/categories">
              <Button variant="ghost" size="sm">
                Manage
                <IconArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {overspentCategories.map((c) => {
              const overspentAmt = c.spent - c.planned
              return (
                <div key={c.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{c.name}</span>
                    <span className="text-red-400">
                      {formatCurrency(c.spent)} / {formatCurrency(c.planned)}
                      <span className="ml-2 text-xs text-red-500">({formatCurrency(overspentAmt)} over)</span>
                    </span>
                  </div>
                  <ProgressBar value={c.spent} max={c.planned} />
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* ── Recent transactions ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <Link to="/transactions">
            <Button variant="ghost" size="sm">
              View all
              <IconArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile card list */}
          <div className="space-y-3 p-4 lg:hidden">
            {transactions.slice(0, 7).map((t) => (
              <TransactionListItem
                key={t.id}
                transaction={t}
                formatCurrency={formatCurrency}
              />
            ))}
            {transactions.length === 0 && (
              <p className="py-8 text-center text-sm text-muted">
                No transactions yet — add your first one above.
              </p>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Description</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Account</th>
                  <th className="px-6 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 7).map((t, i) => (
                  <tr
                    key={t.id}
                    className={`border-b border-border/60 last:border-0 transition-colors hover:bg-surface-muted/30 ${
                      i % 2 !== 0 ? 'bg-surface-solid/20' : ''
                    }`}
                  >
                    <td className="px-6 py-3.5 text-muted-fg">{formatShortDate(t.date)}</td>
                    <td className="px-6 py-3.5">
                      <span className="font-medium text-foreground">{t.description}</span>
                      {t.reimbursable === 'pending' && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                          Reimb.
                        </span>
                      )}
                      {t.isSplit && (
                        <span className="ml-1 inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-400">
                          Split
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge>{t.category}</Badge>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-muted">{t.account}</td>
                    <td
                      className={`px-6 py-3.5 text-right font-semibold tabular-nums ${
                        t.amount >= 0 ? 'text-success' : 'text-foreground'
                      }`}
                    >
                      {t.amount >= 0 ? '+' : ''}
                      {formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted">
                      No transactions yet — add your first one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AddTransactionModal
        open={addTransactionOpen}
        onClose={() => setAddTransactionOpen(false)}
        initialBudgetId={currentBudget?.id}
      />
    </div>
  )
}
