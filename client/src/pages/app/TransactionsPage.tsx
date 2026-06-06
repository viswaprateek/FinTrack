import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { useApiClient, budgetsApi, categoriesApi, transactionsApi } from '../../api'
import type { TransactionSplitInput } from '../../api/endpoints/transactions'
import { formatCurrency, formatShortDate } from '../../lib/utils'
import { IconPlus, IconSearch, IconSplit } from '../../components/ui/icons'
import type { ReimbursementStatus } from '../../types'

const reimbursementTone: Record<ReimbursementStatus, 'neutral' | 'warning' | 'success'> = {
  none: 'neutral',
  pending: 'warning',
  received: 'success',
}

interface SplitLine {
  categoryId: string
  amount: string
}

export function TransactionsPage() {
  const client = useApiClient()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All categories')
  const [typeFilter, setTypeFilter] = useState<'All types' | 'Income' | 'Expense'>('All types')
  const [reimbursableFilter, setReimbursableFilter] = useState<'Reimbursable: any' | 'Pending' | 'Received'>('Reimbursable: any')

  const [addOpen, setAddOpen] = useState(false)
  const [splitOn, setSplitOn] = useState(false)
  const [reimbursableOn, setReimbursableOn] = useState(false)

  const [formBudgetId, setFormBudgetId] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategoryId, setFormCategoryId] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formReimbursable, setFormReimbursable] = useState<'pending' | 'received'>('pending')
  const [splitLines, setSplitLines] = useState<SplitLine[]>([{ categoryId: '', amount: '' }])

  const budgetsQuery = useQuery({ queryKey: ['budgets'], queryFn: () => budgetsApi.list(client) })
  const budgets = budgetsQuery.data ?? []
  const activeFormBudgetId = formBudgetId || budgets[0]?.id || ''

  const formCategoriesQuery = useQuery({
    queryKey: ['categories', activeFormBudgetId],
    queryFn: () => categoriesApi.listForBudget(client, activeFormBudgetId),
    enabled: addOpen && !!activeFormBudgetId,
  })
  const formCategories = formCategoriesQuery.data ?? []

  const transactionsQuery = useQuery({ queryKey: ['transactions'], queryFn: () => transactionsApi.list(client) })
  const transactions = transactionsQuery.data ?? []

  const categoryOptions = useMemo(
    () => ['All categories', ...Array.from(new Set(transactions.map((t) => t.category)))],
    [transactions],
  )

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchesCategory = category === 'All categories' || t.category === category
      const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase())
      const matchesType =
        typeFilter === 'All types' ||
        (typeFilter === 'Income' && t.amount >= 0) ||
        (typeFilter === 'Expense' && t.amount < 0)
      const matchesReimbursable =
        reimbursableFilter === 'Reimbursable: any' ||
        (reimbursableFilter === 'Pending' && t.reimbursable === 'pending') ||
        (reimbursableFilter === 'Received' && t.reimbursable === 'received')
      return matchesCategory && matchesSearch && matchesType && matchesReimbursable
    })
  }, [transactions, search, category, typeFilter, reimbursableFilter])

  function resetForm() {
    setFormBudgetId('')
    setFormDate('')
    setFormAmount('')
    setFormDescription('')
    setFormCategoryId('')
    setFormNotes('')
    setSplitOn(false)
    setReimbursableOn(false)
    setFormReimbursable('pending')
    setSplitLines([{ categoryId: '', amount: '' }])
  }

  function openAdd() {
    resetForm()
    setAddOpen(true)
  }

  const createTransaction = useMutation({
    mutationFn: () => {
      const splits: TransactionSplitInput[] | undefined = splitOn
        ? splitLines
            .filter((s) => s.categoryId && s.amount)
            .map((s) => ({ category_id: s.categoryId, amount: Number(s.amount) }))
        : undefined

      return transactionsApi.create(client, {
        budget_id: activeFormBudgetId,
        category_id: formCategoryId || null,
        date: formDate,
        description: formDescription,
        amount: Math.abs(Number(formAmount)),
        type: Number(formAmount) < 0 ? 'expense' : 'income',
        reimbursable: reimbursableOn ? formReimbursable : 'none',
        notes: formNotes || null,
        splits: splits && splits.length > 0 ? splits : undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      setAddOpen(false)
      resetForm()
    },
  })

  function addSplitLine() {
    setSplitLines((lines) => [...lines, { categoryId: '', amount: '' }])
  }

  function updateSplitLine(index: number, patch: Partial<SplitLine>) {
    setSplitLines((lines) => lines.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  const canSubmit =
    !!activeFormBudgetId && !!formDate && !!formAmount && !!formDescription && (!splitOn || splitLines.some((s) => s.categoryId && s.amount))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Transactions</h2>
          <p className="mt-1 text-sm text-slate-500">Your full ledger across all accounts.</p>
        </div>
        <Button onClick={openAdd}>
          <IconPlus className="h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search by description"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
          >
            {categoryOptions.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
          >
            <option>All types</option>
            <option>Income</option>
            <option>Expense</option>
          </select>
          <select
            value={reimbursableFilter}
            onChange={(e) => setReimbursableFilter(e.target.value as typeof reimbursableFilter)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
          >
            <option>Reimbursable: any</option>
            <option>Pending</option>
            <option>Received</option>
          </select>
        </div>
      </Card>

      {filtered.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Description</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Account</th>
                  <th className="px-6 py-3 font-medium">Reimbursable</th>
                  <th className="px-6 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-slate-800/60 last:border-0">
                    <td className="px-6 py-3.5 text-slate-400">{formatShortDate(t.date)}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2 font-medium text-slate-200">
                        {t.description}
                        {t.isSplit && <IconSplit className="h-3.5 w-3.5 text-sky-400" />}
                      </div>
                      {t.notes && <p className="mt-0.5 text-xs text-slate-500">{t.notes}</p>}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge>{t.category}</Badge>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">{t.account}</td>
                    <td className="px-6 py-3.5">
                      {t.reimbursable !== 'none' ? (
                        <Badge tone={reimbursementTone[t.reimbursable]}>
                          {t.reimbursable === 'pending' ? 'Pending' : 'Received'}
                        </Badge>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
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
      ) : (
        <EmptyState title="No transactions found" description="Try adjusting your filters, or add your first transaction." />
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setAddOpen(false)}>
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CardContent className="space-y-4 pt-6">
              <h3 className="text-base font-semibold text-white">Add Transaction</h3>

              {budgets.length > 1 && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Budget</label>
                  <select
                    value={activeFormBudgetId}
                    onChange={(e) => {
                      setFormBudgetId(e.target.value)
                      setFormCategoryId('')
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                  >
                    {budgets.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Date</label>
                  <input
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    type="date"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Amount (negative for expense)</label>
                  <input
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    type="number"
                    placeholder="-0.00"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Description</label>
                <input
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  type="text"
                  placeholder="e.g. Whole Foods Market"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              {!splitOn && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Category</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="">Uncategorized</option>
                    {formCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl bg-slate-800/40 px-4 py-3">
                <span className="text-sm font-medium text-slate-300">Split transaction</span>
                <button
                  onClick={() => setSplitOn((v) => !v)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${splitOn ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${splitOn ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {splitOn && (
                <div className="space-y-2 rounded-xl border border-slate-800 p-3">
                  {splitLines.map((line, i) => (
                    <div key={i} className="flex gap-2">
                      <select
                        value={line.categoryId}
                        onChange={(e) => updateSplitLine(i, { categoryId: e.target.value })}
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                      >
                        <option value="">Select category</option>
                        {formCategories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <input
                        value={line.amount}
                        onChange={(e) => updateSplitLine(i, { amount: e.target.value })}
                        type="number"
                        placeholder="Amount"
                        className="w-28 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                      />
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" onClick={addSplitLine}>+ Add split line</Button>
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl bg-slate-800/40 px-4 py-3">
                <span className="text-sm font-medium text-slate-300">Reimbursable</span>
                <button
                  onClick={() => setReimbursableOn((v) => !v)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${reimbursableOn ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${reimbursableOn ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {reimbursableOn && (
                <select
                  value={formReimbursable}
                  onChange={(e) => setFormReimbursable(e.target.value as 'pending' | 'received')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="received">Received</option>
                </select>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional notes"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              {createTransaction.isError && <p className="text-sm text-red-400">Failed to save transaction.</p>}

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button onClick={() => createTransaction.mutate()} disabled={createTransaction.isPending || !canSubmit}>
                  {createTransaction.isPending ? 'Saving…' : 'Save Transaction'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
