import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useApiClient, budgetsApi, categoriesApi, recurringApi } from '../../api'
import { formatCurrency, formatShortDate } from '../../lib/utils'
import { IconClock, IconPlus } from '../../components/ui/icons'
import type { RecurringFrequency, RecurringRule, RecurringStatus } from '../../types'

const frequencyLabel: Record<RecurringFrequency, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
}

const statusTone: Record<RecurringStatus, 'success' | 'neutral'> = {
  active: 'success',
  paused: 'neutral',
}

const frequencyOptions: RecurringFrequency[] = ['weekly', 'monthly', 'quarterly', 'yearly']

export function RecurringPage() {
  const client = useApiClient()
  const queryClient = useQueryClient()

  const [addOpen, setAddOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formCategoryId, setFormCategoryId] = useState('')
  const [formFrequency, setFormFrequency] = useState<RecurringFrequency>('monthly')
  const [formNextDue, setFormNextDue] = useState('')

  const [editTarget, setEditTarget] = useState<RecurringRule | null>(null)
  const [editName, setEditName] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editFrequency, setEditFrequency] = useState<RecurringFrequency>('monthly')
  const [editNextDue, setEditNextDue] = useState('')
  const [editStatus, setEditStatus] = useState<RecurringStatus>('active')

  const budgetsQuery = useQuery({ queryKey: ['budgets'], queryFn: () => budgetsApi.list(client) })
  const currentBudget = budgetsQuery.data?.[0]

  const categoriesQuery = useQuery({
    queryKey: ['categories', currentBudget?.id],
    queryFn: () => categoriesApi.listForBudget(client, currentBudget!.id),
    enabled: !!currentBudget,
  })
  const categories = categoriesQuery.data ?? []

  const rulesQuery = useQuery({ queryKey: ['recurring-rules'], queryFn: () => recurringApi.list(client) })
  const upcomingQuery = useQuery({ queryKey: ['recurring-rules', 'upcoming', 30], queryFn: () => recurringApi.upcoming(client, 30) })

  const rules = rulesQuery.data ?? []
  const upcomingBills = upcomingQuery.data ?? []

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['recurring-rules'] })
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    queryClient.invalidateQueries({ queryKey: ['budgets'] })
  }

  function resetAddForm() {
    setFormName('')
    setFormAmount('')
    setFormCategoryId('')
    setFormFrequency('monthly')
    setFormNextDue('')
  }

  function openAdd() {
    resetAddForm()
    setAddOpen(true)
  }

  const createRule = useMutation({
    mutationFn: () =>
      recurringApi.create(client, {
        name: formName,
        amount: Number(formAmount),
        frequency: formFrequency,
        next_due: formNextDue,
        category_id: formCategoryId || null,
      }),
    onSuccess: () => {
      invalidate()
      setAddOpen(false)
      resetAddForm()
    },
  })

  function openEdit(rule: RecurringRule) {
    setEditTarget(rule)
    setEditName(rule.name)
    setEditAmount(String(rule.amount))
    setEditFrequency(rule.frequency)
    setEditNextDue(rule.nextDue)
    setEditStatus(rule.status)
  }

  const updateRule = useMutation({
    mutationFn: () =>
      recurringApi.update(client, editTarget!.id, {
        name: editName,
        amount: Number(editAmount),
        frequency: editFrequency,
        next_due: editNextDue,
        status: editStatus,
      }),
    onSuccess: () => {
      invalidate()
      setEditTarget(null)
    },
  })

  const postRule = useMutation({
    mutationFn: (ruleId: string) => recurringApi.post(client, ruleId, { budget_id: currentBudget!.id }),
    onSuccess: () => invalidate(),
  })

  const canSubmitAdd = !!formName && !!formAmount && !!formNextDue

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Recurring Bills</h2>
          <p className="mt-1 text-sm text-slate-500">Automate bills and subscriptions so nothing slips through.</p>
        </div>
        <Button onClick={openAdd}>
          <IconPlus className="h-4 w-4" />
          Add Rule
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming (next 30 days)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingBills.map((bill) => (
            <div key={bill.id} className="flex items-center justify-between rounded-xl bg-slate-800/40 px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                  <IconClock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{bill.name}</p>
                  <p className="text-xs text-slate-500">
                    Due {formatShortDate(bill.dueDate)} · {bill.category}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-200">{formatCurrency(bill.amount)}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => postRule.mutate(bill.id)}
                  disabled={postRule.isPending || !currentBudget}
                >
                  {postRule.isPending && postRule.variables === bill.id ? 'Posting…' : 'Mark as Posted'}
                </Button>
              </div>
            </div>
          ))}
          {upcomingBills.length === 0 && <p className="text-sm text-slate-500">Nothing due in the next 30 days.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Rules</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Frequency</th>
                <th className="px-6 py-3 font-medium">Next Due</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-b border-slate-800/60 last:border-0">
                  <td className="px-6 py-3.5 font-medium text-slate-200">{r.name}</td>
                  <td className="px-6 py-3.5 text-slate-400">{formatCurrency(r.amount)}</td>
                  <td className="px-6 py-3.5 text-slate-400">{frequencyLabel[r.frequency]}</td>
                  <td className="px-6 py-3.5 text-slate-400">{formatShortDate(r.nextDue)}</td>
                  <td className="px-6 py-3.5">
                    <Badge>{r.category}</Badge>
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge tone={statusTone[r.status]}>{r.status}</Badge>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rules.length === 0 && <p className="px-6 py-8 text-sm text-slate-500">No recurring rules yet.</p>}
        </CardContent>
      </Card>

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setAddOpen(false)}>
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CardContent className="space-y-4 pt-6">
              <h3 className="text-base font-semibold text-white">Add Recurring Rule</h3>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Name</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  type="text"
                  placeholder="e.g. Rent"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Amount</label>
                  <input
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    type="number"
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Category</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Frequency</label>
                <select
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(e.target.value as RecurringFrequency)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                >
                  {frequencyOptions.map((f) => (
                    <option key={f} value={f}>{frequencyLabel[f]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Next due date</label>
                <input
                  value={formNextDue}
                  onChange={(e) => setFormNextDue(e.target.value)}
                  type="date"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              {createRule.isError && <p className="text-sm text-red-400">Failed to add rule.</p>}

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button onClick={() => createRule.mutate()} disabled={createRule.isPending || !canSubmitAdd}>
                  {createRule.isPending ? 'Saving…' : 'Save Rule'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setEditTarget(null)}>
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CardContent className="space-y-4 pt-6">
              <h3 className="text-base font-semibold text-white">Edit Recurring Rule</h3>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  type="text"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Amount</label>
                  <input
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    type="number"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as RecurringStatus)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Frequency</label>
                  <select
                    value={editFrequency}
                    onChange={(e) => setEditFrequency(e.target.value as RecurringFrequency)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                  >
                    {frequencyOptions.map((f) => (
                      <option key={f} value={f}>{frequencyLabel[f]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Next due date</label>
                  <input
                    value={editNextDue}
                    onChange={(e) => setEditNextDue(e.target.value)}
                    type="date"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              {updateRule.isError && <p className="text-sm text-red-400">Failed to save rule.</p>}

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
                <Button onClick={() => updateRule.mutate()} disabled={updateRule.isPending || !editName}>
                  {updateRule.isPending ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
