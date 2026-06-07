import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { useApiClient, budgetsApi } from '../../api'
import { useCurrency } from '../../contexts/CurrencyContext'
import { ContentLoader } from '../../components/ui/Spinner'
import { IconPlus } from '../../components/ui/icons'

export function BudgetListPage() {
  const client = useApiClient()
  const queryClient = useQueryClient()
  const { currency, formatCurrency } = useCurrency()
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')

  const budgetsQuery = useQuery({ queryKey: ['budgets'], queryFn: () => budgetsApi.list(client) })

  const createBudget = useMutation({
    mutationFn: () =>
      budgetsApi.create(client, { name, period_start: periodStart, period_end: periodEnd, currency }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      setCreateOpen(false)
      setName('')
      setPeriodStart('')
      setPeriodEnd('')
    },
  })

  const budgets = budgetsQuery.data ?? []

  function openCreate() {
    setName('')
    setPeriodStart('')
    setPeriodEnd('')
    setCreateOpen(true)
  }

  function submitCreate() {
    if (!name || !periodStart || !periodEnd) return
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
          <p className="mt-1 text-sm text-slate-500">Plan and track your spending month by month.</p>
        </div>
        <Button onClick={openCreate}>
          <IconPlus className="h-4 w-4" />
          New Budget
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
            <p className="mt-1 text-sm text-slate-500">Create your first one to start planning your spending.</p>
            <Button className="mt-4" onClick={openCreate}>
              <IconPlus className="h-4 w-4" />
              New Budget
            </Button>
          </CardContent>
        </Card>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setCreateOpen(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>New Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  placeholder="e.g. July 2026"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
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
              {createBudget.isError && <p className="text-sm text-red-400">Failed to create budget. Please try again.</p>}
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
