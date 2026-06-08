import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BudgetYearCalendar, monthPeriodLabel } from '../../components/budgets/BudgetYearCalendar'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { useApiClient, budgetsApi } from '../../api'
import { useBudgetPeriod } from '../../contexts/BudgetPeriodContext'
import { useCurrency } from '../../contexts/CurrencyContext'
import {
  budgetForCalendarMonth,
  findPriorBudgetForCopy,
  isCurrentCalendarMonth,
  monthlyBudgetPeriod,
} from '../../lib/budgets'
import { ContentLoader } from '../../components/ui/Spinner'
import { IconChevronLeft, IconChevronRight } from '../../components/ui/icons'
import { cn } from '../../lib/utils'

export function BudgetListPage() {
  const client = useApiClient()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { formatCurrency } = useCurrency()
  const { currentBudget, selectBudget } = useBudgetPeriod()
  const now = new Date()

  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number | null>(now.getMonth() + 1)
  const [copyEnvelopes, setCopyEnvelopes] = useState(true)

  const budgetsQuery = useQuery({ queryKey: ['budgets'], queryFn: () => budgetsApi.list(client) })
  const budgets = budgetsQuery.data ?? []

  const selectedBudget = useMemo(() => {
    if (selectedMonth === null) return null
    return budgetForCalendarMonth(budgets, viewYear, selectedMonth)
  }, [budgets, viewYear, selectedMonth])

  const selectedPeriod = useMemo(() => {
    if (selectedMonth === null) return null
    return monthlyBudgetPeriod(viewYear, selectedMonth)
  }, [viewYear, selectedMonth])

  const copySourceBudget = useMemo(() => {
    if (selectedMonth === null) return null
    return findPriorBudgetForCopy(budgets, viewYear, selectedMonth)
  }, [budgets, viewYear, selectedMonth])

  const createBudget = useMutation({
    mutationFn: () => {
      if (!selectedPeriod) throw new Error('No month selected')
      return budgetsApi.create(client, {
        name: selectedPeriod.name,
        period_start: selectedPeriod.periodStart,
        period_end: selectedPeriod.periodEnd,
        copy_from_budget_id: copyEnvelopes && copySourceBudget ? copySourceBudget.id : null,
      })
    },
    onSuccess: (budget) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      selectBudget(budget.id)
    },
  })

  function openBudget(id: string) {
    selectBudget(id)
    navigate(`/budgets/${id}`)
  }

  if (budgetsQuery.isLoading) {
    return <ContentLoader label="Loading budgets…" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">My Budgets</h2>
        <p className="mt-1 text-sm text-slate-500">
          Pick a month on the calendar — create a budget only when you&apos;re ready.
        </p>
      </div>

      <Card className="overflow-hidden border-slate-800/80 bg-slate-900/40 p-0">
        {/* Year binder header */}
        <div className="border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800/80 to-slate-900 px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="secondary"
              size="sm"
              aria-label="Previous year"
              onClick={() => setViewYear((y) => y - 1)}
              className="shrink-0"
            >
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">Annual planner</p>
              <h3 className="mt-0.5 font-serif text-3xl font-medium tracking-tight text-white sm:text-4xl">{viewYear}</h3>
            </div>
            <Button
              variant="secondary"
              size="sm"
              aria-label="Next year"
              onClick={() => setViewYear((y) => y + 1)}
              className="shrink-0"
            >
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 flex justify-center gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 w-1.5 rounded-full transition-colors',
                  selectedMonth === i + 1 ? 'bg-emerald-400' : 'bg-slate-600',
                )}
              />
            ))}
          </div>
        </div>

        <div className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/20 via-slate-950/50 to-slate-950 p-4 sm:p-6">
          <BudgetYearCalendar
            year={viewYear}
            budgets={budgets}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            formatCurrency={formatCurrency}
          />
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-800 bg-slate-950/50 px-4 py-3 text-[11px] text-slate-500 sm:px-6">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            Today
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-6 rounded bg-gradient-to-r from-emerald-600/80 to-teal-500/60" />
            Month header
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded border border-dashed border-slate-600" />
            No budget yet
          </span>
        </div>
      </Card>

      {selectedMonth !== null && selectedPeriod && (
        <Card>
          <CardHeader>
            <CardTitle>{monthPeriodLabel(viewYear, selectedMonth)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedBudget ? (
              <>
                <p className="text-sm text-slate-400">
                  {selectedPeriod.periodStart} → {selectedPeriod.periodEnd}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Planned</p>
                    <p className="mt-0.5 font-medium text-slate-200">{formatCurrency(selectedBudget.plannedTotal)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Spent</p>
                    <p className="mt-0.5 font-medium text-slate-200">{formatCurrency(selectedBudget.spentTotal)}</p>
                  </div>
                </div>
                <ProgressBar value={selectedBudget.spentTotal} max={selectedBudget.plannedTotal || 1} />
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button onClick={() => openBudget(selectedBudget.id)}>Open budget</Button>
                  {currentBudget?.id !== selectedBudget.id && (
                    <Button variant="secondary" size="sm" onClick={() => selectBudget(selectedBudget.id)}>
                      Set as active month
                    </Button>
                  )}
                  {currentBudget?.id === selectedBudget.id && (
                    <span className="text-xs text-emerald-400">Active in app header</span>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-400">No budget for this month yet.</p>
                <div className="rounded-xl border border-slate-800 bg-slate-800/30 px-4 py-3 text-sm">
                  <p className="font-medium text-slate-200">{selectedPeriod.name}</p>
                  <p className="mt-1 text-slate-500">
                    {selectedPeriod.periodStart} → {selectedPeriod.periodEnd}
                  </p>
                </div>

                {copySourceBudget && (
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={copyEnvelopes}
                      onChange={(e) => setCopyEnvelopes(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-300">
                      Copy category envelopes from {copySourceBudget.name}
                    </span>
                  </label>
                )}

                {createBudget.isError && (
                  <p className="text-sm text-red-400">Could not create budget. It may already exist for this month.</p>
                )}

                <Button
                  onClick={() => createBudget.mutate()}
                  disabled={createBudget.isPending}
                  className={cn(isCurrentCalendarMonth(viewYear, selectedMonth) && 'ring-2 ring-emerald-400/30')}
                >
                  {createBudget.isPending ? 'Creating…' : 'Create budget'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
