import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ToggleSwitch } from '../../components/ui/ToggleSwitch'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { ContentLoader } from '../../components/ui/Spinner'
import { useApiClient, categoriesApi, transactionsApi } from '../../api'
import { useBudgetPeriod } from '../../contexts/BudgetPeriodContext'
import { useCurrency } from '../../contexts/CurrencyContext'
import { budgetForDate, clampDateToBudget, isDateInBudget } from '../../lib/budgets'
import { formatShortDate } from '../../lib/utils'
import { IconPlus, IconSearch, IconSplit } from '../../components/ui/icons'
import { AddTransactionModal } from '../../components/transactions/AddTransactionModal'
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

export function TransactionsPage() {
  const client = useApiClient()
  const queryClient = useQueryClient()
  const { formatCurrency } = useCurrency()

  const isMobile = useIsMobile()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All categories')
  const [typeFilter, setTypeFilter] = useState<'All types' | 'Income' | 'Expense'>('All types')
  const [shareFilter, setShareFilter] = useState<
    'All transactions' | 'Shared with friends' | 'Employer reimbursement'
  >('All transactions')

  const [addOpen, setAddOpen] = useState(false)

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

  const libraryQuery = useQuery({
    queryKey: ['category-library'],
    queryFn: () => categoriesApi.listAll(client),
    enabled: !!editTarget,
  })
  const allCategories = libraryQuery.data ?? []

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
      const matchesShare =
        shareFilter === 'All transactions' ||
        (shareFilter === 'Shared with friends' && t.hasFriendSplit) ||
        (shareFilter === 'Employer reimbursement' && t.reimbursable !== 'none' && !t.hasFriendSplit)
      return matchesCategory && matchesSearch && matchesType && matchesShare
    })
  }, [transactions, search, category, typeFilter, shareFilter])

  const mismatchedTransactions = useMemo(
    () => transactions.filter((t) => isMismatchedTransaction(t, budgets)),
    [transactions, budgets],
  )

  function invalidateTransactions() {
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    queryClient.invalidateQueries({ queryKey: ['budgets'] })
  }

  function openAdd() {
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

  const editDateInBudget = editBudget && editDate ? isDateInBudget(editDate, editBudget) : false

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
          <h2 className="text-lg font-semibold text-heading sm:text-xl">Transactions</h2>
          <p className="mt-1 text-sm text-muted">Expenses and income for the selected month.</p>
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
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Search by description"
                className="w-full rounded-xl border border-border-muted bg-input py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
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
              className="w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted sm:w-auto"
            >
              {categoryOptions.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted sm:w-auto"
            >
              <option>All types</option>
              <option>Income</option>
              <option>Expense</option>
            </select>
            <select
              value={shareFilter}
              onChange={(e) => setShareFilter(e.target.value as typeof shareFilter)}
              className="w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted sm:w-auto"
            >
              <option>All transactions</option>
              <option>Shared with friends</option>
              <option>Employer reimbursement</option>
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
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
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
                  <tr key={t.id} className="border-b border-border/60 last:border-0">
                    <td className="px-6 py-3.5 text-muted-fg">{formatShortDate(t.date)}</td>
                    <td className={`px-6 py-3.5 text-xs ${mismatched ? 'text-amber-400' : 'text-muted'}`}>
                      {txBudget?.period ?? '—'}
                      {mismatched && <span className="ml-1" title="Date falls outside this budget period">⚠</span>}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2 font-medium text-foreground">
                        {t.description}
                        {t.isSplit && <IconSplit className="h-3.5 w-3.5 text-sky-400" />}
                      </div>
                      {t.notes && <p className="mt-0.5 text-xs text-muted">{t.notes}</p>}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge>{t.category}</Badge>
                    </td>
                    <td className="px-6 py-3.5 text-muted-fg">{t.account}</td>
                    <td className="px-6 py-3.5">
                      {t.reimbursable !== 'none' ? (
                        <Badge tone={reimbursementTone[t.reimbursable]}>
                          {t.reimbursable === 'pending' ? 'Pending' : 'Received'}
                        </Badge>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className={`px-6 py-3.5 text-right font-semibold ${t.amount >= 0 ? 'text-success' : 'text-foreground'}`}>
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
              <h3 className="text-base font-semibold text-heading">Delete transaction?</h3>
              <p className="text-sm text-muted-fg">
                Remove <span className="font-medium text-foreground">{deleteTarget.description}</span>
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
              <h3 className="text-base font-semibold text-heading">Edit Transaction</h3>

              {editTarget.isSplit && (
                <p className="rounded-xl border border-sky-500/30 bg-sky-500/5 px-4 py-3 text-sm text-sky-200">
                  Split transactions: you can edit date, amount, and description. Category splits are unchanged.
                </p>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-subtle">Monthly budget</label>
                <select
                  value={activeEditBudgetId}
                  onChange={(e) => handleEditBudgetChange(e.target.value)}
                  className="w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
                >
                  {budgets.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} · {b.period}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-subtle">Date</label>
                  <input
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    type="date"
                    min={editBudget?.periodStart}
                    max={editBudget?.periodEnd}
                    className="w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
                  />
                  {editBudget && editDate && !editDateInBudget && (
                    <p className="mt-1 text-xs text-red-400">Date must fall inside this budget&apos;s period.</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-subtle">Amount (negative for expense)</label>
                  <input
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    type="number"
                    className="w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-subtle">Description</label>
                <input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  type="text"
                  className="w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
                />
              </div>

              {!editTarget.isSplit && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-subtle">Category</label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
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

              <div className="flex items-center justify-between gap-3 rounded-xl bg-input/40 px-4 py-3">
                <span className="text-sm font-medium text-subtle">Expect reimbursement (employer)</span>
                <ToggleSwitch
                  checked={editReimbursableOn}
                  disabled={editTarget.hasFriendSplit}
                  aria-label="Expect reimbursement"
                  onChange={() => setEditReimbursableOn((v) => !v)}
                />
              </div>
              {editReimbursableOn && (
                <select
                  value={editReimbursable}
                  onChange={(e) => setEditReimbursable(e.target.value as 'pending' | 'received')}
                  className="w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
                >
                  <option value="pending">Pending</option>
                  <option value="received">Received</option>
                </select>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-subtle">Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
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

      <AddTransactionModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        initialBudgetId={currentBudget?.id}
      />
    </div>
  )
}
