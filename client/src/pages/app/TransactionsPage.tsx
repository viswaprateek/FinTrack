import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { ContentLoader } from '../../components/ui/Spinner'
import { useApiClient, categoriesApi, transactionsApi } from '../../api'
import type { TransactionSplitInput } from '../../api/endpoints/transactions'
import { useBudgetPeriod } from '../../contexts/BudgetPeriodContext'
import { useCurrency } from '../../contexts/CurrencyContext'
import { budgetForDate, clampDateToBudget, isDateInBudget } from '../../lib/budgets'
import { formatShortDate } from '../../lib/utils'
import { IconPlus, IconSearch, IconSplit } from '../../components/ui/icons'
import { TransactionListItem } from '../../components/transactions/TransactionListItem'
import { useIsMobile } from '../../hooks/useMediaQuery'
import type { Budget, ReimbursementStatus, Transaction } from '../../types'

function isMismatchedTransaction(transaction: Transaction, budgets: Budget[]): boolean {
  const correctBudget = budgetForDate(budgets, transaction.date)
  return !!correctBudget && correctBudget.id !== transaction.budgetId
}

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
  const { formatCurrency } = useCurrency()

  const isMobile = useIsMobile()
  const [filtersOpen, setFiltersOpen] = useState(false)
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
  const [newCategoryOpen, setNewCategoryOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [editBudgetId, setEditBudgetId] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editReimbursableOn, setEditReimbursableOn] = useState(false)
  const [editReimbursable, setEditReimbursable] = useState<'pending' | 'received'>('pending')
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)

  const { budgets, currentBudget, isLoading: budgetsLoading } = useBudgetPeriod()
  const formOpen = addOpen || !!editTarget
  const activeFormBudgetId = formBudgetId || currentBudget?.id || ''

  const libraryQuery = useQuery({
    queryKey: ['category-library'],
    queryFn: () => categoriesApi.listAll(client),
    enabled: formOpen,
  })
  const allCategories = libraryQuery.data ?? []

  const formCategoriesQuery = useQuery({
    queryKey: ['categories', activeFormBudgetId],
    queryFn: () => categoriesApi.listForBudget(client, activeFormBudgetId),
    enabled: addOpen && !!activeFormBudgetId,
  })
  const envelopeIds = useMemo(
    () => new Set((formCategoriesQuery.data ?? []).map((c) => c.id)),
    [formCategoriesQuery.data],
  )

  const activeBudget = useMemo(
    () => budgets.find((b) => b.id === activeFormBudgetId) ?? null,
    [budgets, activeFormBudgetId],
  )

  const activeEditBudgetId = editBudgetId || editTarget?.budgetId || ''
  const editCategoriesQuery = useQuery({
    queryKey: ['categories', activeEditBudgetId],
    queryFn: () => categoriesApi.listForBudget(client, activeEditBudgetId),
    enabled: !!editTarget && !!activeEditBudgetId,
  })
  const editEnvelopeIds = useMemo(
    () => new Set((editCategoriesQuery.data ?? []).map((c) => c.id)),
    [editCategoriesQuery.data],
  )
  const editBudget = useMemo(
    () => budgets.find((b) => b.id === activeEditBudgetId) ?? null,
    [budgets, activeEditBudgetId],
  )

  const transactionsQuery = useQuery({
    queryKey: ['transactions', { budgetId: currentBudget?.id }],
    queryFn: () => transactionsApi.list(client, { budget_id: currentBudget!.id }),
    enabled: !!currentBudget,
  })
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

  const mismatchedTransactions = useMemo(
    () => transactions.filter((t) => isMismatchedTransaction(t, budgets)),
    [transactions, budgets],
  )

  function invalidateTransactions() {
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    queryClient.invalidateQueries({ queryKey: ['budgets'] })
  }

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
    setNewCategoryOpen(false)
    setNewCategoryName('')
  }

  function openAdd() {
    resetForm()
    const today = new Date().toISOString().substring(0, 10)
    const match = budgetForDate(budgets, today) ?? currentBudget ?? null
    if (match) {
      setFormBudgetId(match.id)
      setFormDate(clampDateToBudget(today, match))
    } else {
      setFormDate(today)
    }
    setAddOpen(true)
  }

  function openEdit(transaction: Transaction) {
    setEditTarget(transaction)
    setEditBudgetId(transaction.budgetId)
    setEditDate(transaction.date)
    setEditAmount(String(transaction.amount))
    setEditDescription(transaction.description)
    setEditCategoryId(transaction.categoryId ?? '')
    setEditNotes(transaction.notes ?? '')
    setEditReimbursableOn(transaction.reimbursable !== 'none')
    setEditReimbursable(transaction.reimbursable === 'received' ? 'received' : 'pending')
  }

  function closeEdit() {
    setEditTarget(null)
    setEditBudgetId('')
    setEditDate('')
    setEditAmount('')
    setEditDescription('')
    setEditCategoryId('')
    setEditNotes('')
    setEditReimbursableOn(false)
    setEditReimbursable('pending')
  }

  function handleBudgetChange(budgetId: string) {
    const budget = budgets.find((b) => b.id === budgetId)
    setFormBudgetId(budgetId)
    setFormCategoryId('')
    if (budget && formDate) {
      setFormDate(clampDateToBudget(formDate, budget))
    }
  }

  useEffect(() => {
    if (!formDate || budgets.length === 0 || !addOpen) return
    const match = budgetForDate(budgets, formDate)
    if (match && match.id !== activeFormBudgetId) {
      setFormBudgetId(match.id)
      setFormCategoryId('')
    }
  }, [formDate, budgets, activeFormBudgetId, addOpen])

  useEffect(() => {
    if (!editDate || budgets.length === 0 || !editTarget) return
    const match = budgetForDate(budgets, editDate)
    if (match && match.id !== activeEditBudgetId) {
      setEditBudgetId(match.id)
      setEditCategoryId('')
    }
  }, [editDate, budgets, activeEditBudgetId, editTarget])

  function handleEditBudgetChange(budgetId: string) {
    const budget = budgets.find((b) => b.id === budgetId)
    setEditBudgetId(budgetId)
    setEditCategoryId('')
    if (budget && editDate) {
      setEditDate(clampDateToBudget(editDate, budget))
    }
  }

  const createCategory = useMutation({
    mutationFn: (name: string) => categoriesApi.createLibrary(client, { name }),
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ['category-library'] })
      setFormCategoryId(item.id)
      setNewCategoryOpen(false)
      setNewCategoryName('')
    },
  })

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
      invalidateTransactions()
      queryClient.invalidateQueries({ queryKey: ['category-library'] })
      setAddOpen(false)
      resetForm()
    },
  })

  const updateTransaction = useMutation({
    mutationFn: () =>
      transactionsApi.update(client, editTarget!.id, {
        budget_id: activeEditBudgetId,
        category_id: editTarget!.isSplit ? undefined : editCategoryId || null,
        date: editDate,
        description: editDescription,
        amount: Math.abs(Number(editAmount)),
        type: Number(editAmount) < 0 ? 'expense' : 'income',
        reimbursable: editReimbursableOn ? editReimbursable : 'none',
        notes: editNotes || null,
      }),
    onSuccess: () => {
      invalidateTransactions()
      closeEdit()
    },
  })

  const deleteTransaction = useMutation({
    mutationFn: (id: string) => transactionsApi.remove(client, id),
    onSuccess: () => {
      invalidateTransactions()
      setDeleteTarget(null)
      closeEdit()
    },
  })

  const fixMismatched = useMutation({
    mutationFn: async (items: Transaction[]) => {
      for (const t of items) {
        const target = budgetForDate(budgets, t.date)
        if (target && target.id !== t.budgetId) {
          await transactionsApi.update(client, t.id, { budget_id: target.id })
        }
      }
    },
    onSuccess: invalidateTransactions,
  })

  function addSplitLine() {
    setSplitLines((lines) => [...lines, { categoryId: '', amount: '' }])
  }

  function updateSplitLine(index: number, patch: Partial<SplitLine>) {
    setSplitLines((lines) => lines.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  const dateInBudget = activeBudget && formDate ? isDateInBudget(formDate, activeBudget) : false
  const editDateInBudget = editBudget && editDate ? isDateInBudget(editDate, editBudget) : false

  const canSubmit =
    !!activeFormBudgetId &&
    !!activeBudget &&
    dateInBudget &&
    !!formDate &&
    !!formAmount &&
    !!formDescription &&
    (!splitOn || splitLines.some((s) => s.categoryId && s.amount))

  const canSubmitEdit =
    !!editTarget &&
    !!activeEditBudgetId &&
    !!editBudget &&
    editDateInBudget &&
    !!editDate &&
    !!editAmount &&
    !!editDescription

  if (budgetsLoading || transactionsQuery.isLoading) {
    return <ContentLoader label="Loading transactions…" />
  }

  if (!currentBudget) {
    return (
      <EmptyState
        title="No budgets yet"
        description="Create a monthly budget before logging transactions."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-white sm:text-xl">Transactions</h2>
          <p className="mt-1 text-sm text-slate-500">Expenses and income for the selected month.</p>
        </div>
        <Button onClick={openAdd} size="sm" className="shrink-0">
          <IconPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Transaction</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Filter bar */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Search by description"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
              />
            </div>
            {isMobile && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setFiltersOpen((v) => !v)}
                className="shrink-0"
              >
                Filters
              </Button>
            )}
          </div>
          <div className={`flex flex-wrap items-center gap-3 ${isMobile && !filtersOpen ? 'hidden' : ''}`}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none sm:w-auto"
            >
              {categoryOptions.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none sm:w-auto"
            >
              <option>All types</option>
              <option>Income</option>
              <option>Expense</option>
            </select>
            <select
              value={reimbursableFilter}
              onChange={(e) => setReimbursableFilter(e.target.value as typeof reimbursableFilter)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none sm:w-auto"
            >
              <option>Reimbursable: any</option>
              <option>Pending</option>
              <option>Received</option>
            </select>
          </div>
        </div>
      </Card>

      {mismatchedTransactions.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <p className="text-sm text-amber-200">
            {mismatchedTransactions.length} transaction{mismatchedTransactions.length > 1 ? 's' : ''} in this view
            {' '}have dates that belong to a different budget month.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fixMismatched.mutate(mismatchedTransactions)}
            disabled={fixMismatched.isPending}
          >
            {fixMismatched.isPending ? 'Fixing…' : 'Fix mismatched'}
          </Button>
        </div>
      )}

      {filtered.length > 0 ? (
        <>
          <div className="space-y-3 lg:hidden">
            {filtered.map((t) => {
              const txBudget = budgetForDate(budgets, t.date)
              const mismatched = isMismatchedTransaction(t, budgets)
              return (
                <TransactionListItem
                  key={t.id}
                  transaction={t}
                  formatCurrency={formatCurrency}
                  budgetLabel={txBudget?.period}
                  mismatched={mismatched}
                  onEdit={() => openEdit(t)}
                  onDelete={() => setDeleteTarget(t)}
                  onFix={
                    mismatched
                      ? () => {
                          const target = budgetForDate(budgets, t.date)
                          if (target) fixMismatched.mutate([t])
                        }
                      : undefined
                  }
                  fixPending={fixMismatched.isPending}
                />
              )
            })}
          </div>

          <Card className="hidden lg:block">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Budget</th>
                  <th className="px-6 py-3 font-medium">Description</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Account</th>
                  <th className="px-6 py-3 font-medium">Reimbursable</th>
                  <th className="px-6 py-3 text-right font-medium">Amount</th>
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const txBudget = budgetForDate(budgets, t.date)
                  const mismatched = isMismatchedTransaction(t, budgets)
                  return (
                  <tr key={t.id} className="border-b border-slate-800/60 last:border-0">
                    <td className="px-6 py-3.5 text-slate-400">{formatShortDate(t.date)}</td>
                    <td className={`px-6 py-3.5 text-xs ${mismatched ? 'text-amber-400' : 'text-slate-500'}`}>
                      {txBudget?.period ?? '—'}
                      {mismatched && <span className="ml-1" title="Date falls outside this budget period">⚠</span>}
                    </td>
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
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {mismatched && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const target = budgetForDate(budgets, t.date)
                              if (target) fixMismatched.mutate([t])
                            }}
                            disabled={fixMismatched.isPending}
                            title="Move to the budget matching this date"
                          >
                            Fix
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(t)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
        </>
      ) : (
        <EmptyState title="No transactions found" description="Try adjusting your filters, or add your first transaction." />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setDeleteTarget(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardContent className="space-y-4 pt-6">
              <h3 className="text-base font-semibold text-white">Delete transaction?</h3>
              <p className="text-sm text-slate-400">
                Remove <span className="font-medium text-slate-200">{deleteTarget.description}</span>
                {' '}({formatShortDate(deleteTarget.date)}) — this cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                <Button
                  onClick={() => deleteTransaction.mutate(deleteTarget.id)}
                  disabled={deleteTransaction.isPending}
                >
                  {deleteTransaction.isPending ? 'Deleting…' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={closeEdit}>
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CardContent className="space-y-4 pt-6">
              <h3 className="text-base font-semibold text-white">Edit Transaction</h3>

              {editTarget.isSplit && (
                <p className="rounded-xl border border-sky-500/30 bg-sky-500/5 px-4 py-3 text-sm text-sky-200">
                  Split transactions: you can edit date, amount, and description. Category splits are unchanged.
                </p>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Monthly budget</label>
                <select
                  value={activeEditBudgetId}
                  onChange={(e) => handleEditBudgetChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                >
                  {budgets.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} · {b.period}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Date</label>
                  <input
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    type="date"
                    min={editBudget?.periodStart}
                    max={editBudget?.periodEnd}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                  />
                  {editBudget && editDate && !editDateInBudget && (
                    <p className="mt-1 text-xs text-red-400">Date must fall inside this budget&apos;s period.</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Amount (negative for expense)</label>
                  <input
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    type="number"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Description</label>
                <input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  type="text"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              {!editTarget.isSplit && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Category</label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="">Uncategorized</option>
                    {allCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {!editEnvelopeIds.has(c.id) ? ' (adds envelope)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl bg-slate-800/40 px-4 py-3">
                <span className="text-sm font-medium text-slate-300">Reimbursable</span>
                <button
                  type="button"
                  onClick={() => setEditReimbursableOn((v) => !v)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${editReimbursableOn ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${editReimbursableOn ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {editReimbursableOn && (
                <select
                  value={editReimbursable}
                  onChange={(e) => setEditReimbursable(e.target.value as 'pending' | 'received')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="received">Received</option>
                </select>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              {updateTransaction.isError && <p className="text-sm text-red-400">Failed to save changes.</p>}

              <div className="flex items-center justify-between gap-2 pt-1">
                <Button variant="ghost" onClick={() => setDeleteTarget(editTarget)}>Delete</Button>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={closeEdit}>Cancel</Button>
                  <Button onClick={() => updateTransaction.mutate()} disabled={updateTransaction.isPending || !canSubmitEdit}>
                    {updateTransaction.isPending ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setAddOpen(false)}>
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CardContent className="space-y-4 pt-6">
              <h3 className="text-base font-semibold text-white">Add Transaction</h3>

              {budgets.length === 0 ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
                  No budget for today.{' '}
                  <Link to="/budgets" className="font-medium underline hover:text-amber-200">
                    Create a monthly budget
                  </Link>{' '}
                  first.
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Monthly budget</label>
                  <select
                    value={activeFormBudgetId}
                    onChange={(e) => handleBudgetChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                  >
                    {budgets.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} · {b.period}</option>
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
                    min={activeBudget?.periodStart}
                    max={activeBudget?.periodEnd}
                    disabled={!activeBudget}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none disabled:opacity-50"
                  />
                  {activeBudget && (
                    <p className="mt-1 text-xs text-slate-500">
                      Within {activeBudget.period}
                    </p>
                  )}
                  {activeBudget && formDate && !dateInBudget && (
                    <p className="mt-1 text-xs text-red-400">Date must fall inside this budget&apos;s period.</p>
                  )}
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
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">Category</label>
                    <button
                      type="button"
                      onClick={() => setNewCategoryOpen((v) => !v)}
                      className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                    >
                      + New category
                    </button>
                  </div>
                  {newCategoryOpen ? (
                    <div className="flex gap-2">
                      <input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category name"
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                      />
                      <Button
                        size="sm"
                        onClick={() => createCategory.mutate(newCategoryName.trim())}
                        disabled={!newCategoryName.trim() || createCategory.isPending}
                      >
                        Add
                      </Button>
                    </div>
                  ) : (
                    <select
                      value={formCategoryId}
                      onChange={(e) => setFormCategoryId(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                    >
                      <option value="">Uncategorized</option>
                      {allCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                          {!envelopeIds.has(c.id) ? ' (adds envelope)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  {allCategories.length === 0 && !libraryQuery.isLoading && (
                    <p className="mt-2 text-xs text-slate-500">
                      No categories yet.{' '}
                      <Link to="/categories" className="text-emerald-400 hover:text-emerald-300">
                        Browse suggestions
                      </Link>
                    </p>
                  )}
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
                        {allCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                            {!envelopeIds.has(c.id) ? ' (adds envelope)' : ''}
                          </option>
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
