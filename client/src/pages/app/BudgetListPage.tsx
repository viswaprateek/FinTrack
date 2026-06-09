import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BudgetYearFolders } from '../../components/budgets/BudgetYearFolders'
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
  monthPeriodLabel,
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
      {/* Selected month — top */}
      {selectedMonth !== null && selectedPeriod && (
        <Card>
          <CardHeader>
            <CardTitle>{monthPeriodLabel(viewYear, selectedMonth)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedBudget ? (
              <>
                <p className="text-sm text-muted-fg">
                  {selectedPeriod.periodStart} → {selectedPeriod.periodEnd}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted">Planned</p>
                    <p className="mt-0.5 font-medium">{formatCurrency(selectedBudget.plannedTotal)}</p>
                  </div>
                  <div>
                    <p className="text-muted">Spent</p>
                    <p className="mt-0.5 font-medium">{formatCurrency(selectedBudget.spentTotal)}</p>
                  </div>
                </div>
                <ProgressBar value={selectedBudget.spentTotal} max={selectedBudget.plannedTotal || 1} />
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={() => openBudget(selectedBudget.id)}>Open budget</Button>
                  {currentBudget?.id !== selectedBudget.id && (
                    <Button variant="secondary" size="sm" onClick={() => selectBudget(selectedBudget.id)}>
                      Set as active
                    </Button>
                  )}
                  {currentBudget?.id === selectedBudget.id && (
                    <span className="text-xs text-success">Active month</span>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-fg">No budget for this month.</p>
                {copySourceBudget && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={copyEnvelopes}
                      onChange={(e) => setCopyEnvelopes(e.target.checked)}
                      className="rounded border-border text-accent"
                    />
                    Copy envelopes from {copySourceBudget.name}
                  </label>
                )}
                <Button
                  onClick={() => createBudget.mutate()}
                  disabled={createBudget.isPending}
                  className={cn(isCurrentCalendarMonth(viewYear, selectedMonth) && 'ring-2 ring-accent/30')}
                >
                  {createBudget.isPending ? 'Creating…' : 'Create budget'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Year + folders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="secondary" size="sm" onClick={() => setViewYear((y) => y - 1)} aria-label="Previous year">
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-2xl font-bold text-heading">{viewYear}</h3>
          <Button variant="secondary" size="sm" onClick={() => setViewYear((y) => y + 1)} aria-label="Next year">
            <IconChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <BudgetYearFolders
          year={viewYear}
          budgets={budgets}
          activeBudgetId={currentBudget?.id ?? null}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
          formatCurrency={formatCurrency}
        />
      </div>
    </div>
  )
}
