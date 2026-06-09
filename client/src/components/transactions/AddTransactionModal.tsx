import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { useApiClient, categoriesApi, transactionsApi } from '../../api'
import type { TransactionSplitInput } from '../../api/endpoints/transactions'
import { useBudgetPeriod } from '../../contexts/BudgetPeriodContext'
import { budgetForDate, clampDateToBudget, isDateInBudget } from '../../lib/budgets'

interface SplitLine {
  categoryId: string
  amount: string
}

interface AddTransactionModalProps {
  open: boolean
  onClose: () => void
  initialBudgetId?: string
}

export function AddTransactionModal({ open, onClose, initialBudgetId }: AddTransactionModalProps) {
  const client = useApiClient()
  const queryClient = useQueryClient()
  const { budgets, currentBudget } = useBudgetPeriod()

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

  const activeFormBudgetId = formBudgetId || currentBudget?.id || ''

  const libraryQuery = useQuery({
    queryKey: ['category-library'],
    queryFn: () => categoriesApi.listAll(client),
    enabled: open,
  })
  const allCategories = libraryQuery.data ?? []

  const formCategoriesQuery = useQuery({
    queryKey: ['categories', activeFormBudgetId],
    queryFn: () => categoriesApi.listForBudget(client, activeFormBudgetId),
    enabled: open && !!activeFormBudgetId,
  })
  const envelopeIds = useMemo(
    () => new Set((formCategoriesQuery.data ?? []).map((c) => c.id)),
    [formCategoriesQuery.data],
  )

  const activeBudget = useMemo(
    () => budgets.find((b) => b.id === activeFormBudgetId) ?? null,
    [budgets, activeFormBudgetId],
  )

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

  function initForm() {
    resetForm()
    const today = new Date().toISOString().substring(0, 10)
    const preferred =
      (initialBudgetId ? budgets.find((b) => b.id === initialBudgetId) : null) ??
      budgetForDate(budgets, today) ??
      currentBudget ??
      null
    if (preferred) {
      setFormBudgetId(preferred.id)
      setFormDate(clampDateToBudget(today, preferred))
    } else {
      setFormDate(today)
    }
  }

  useEffect(() => {
    if (open) initForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-init only when modal opens
  }, [open])

  useEffect(() => {
    if (!formDate || budgets.length === 0 || !open) return
    const match = budgetForDate(budgets, formDate)
    if (match && match.id !== activeFormBudgetId) {
      setFormBudgetId(match.id)
      setFormCategoryId('')
    }
  }, [formDate, budgets, activeFormBudgetId, open])

  function handleBudgetChange(budgetId: string) {
    const budget = budgets.find((b) => b.id === budgetId)
    setFormBudgetId(budgetId)
    setFormCategoryId('')
    if (budget && formDate) {
      setFormDate(clampDateToBudget(formDate, budget))
    }
  }

  function invalidateTransactions() {
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    queryClient.invalidateQueries({ queryKey: ['budgets'] })
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
      onClose()
      resetForm()
    },
  })

  function addSplitLine() {
    setSplitLines((lines) => [...lines, { categoryId: '', amount: '' }])
  }

  function updateSplitLine(index: number, patch: Partial<SplitLine>) {
    setSplitLines((lines) => lines.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  const dateInBudget = activeBudget && formDate ? isDateInBudget(formDate, activeBudget) : false

  const canSubmit =
    !!activeFormBudgetId &&
    !!activeBudget &&
    dateInBudget &&
    !!formDate &&
    !!formAmount &&
    !!formDescription &&
    (!splitOn || splitLines.some((s) => s.categoryId && s.amount))

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <CardContent className="space-y-4 pt-6">
          <h3 className="text-base font-semibold text-heading">Add Transaction</h3>

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
              <label className="mb-1.5 block text-sm font-medium text-subtle">Monthly budget</label>
              <select
                value={activeFormBudgetId}
                onChange={(e) => handleBudgetChange(e.target.value)}
                className="w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
              >
                {budgets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} · {b.period}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-subtle">Date</label>
              <input
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                type="date"
                min={activeBudget?.periodStart}
                max={activeBudget?.periodEnd}
                disabled={!activeBudget}
                className="w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted disabled:opacity-50"
              />
              {activeBudget && <p className="mt-1 text-xs text-muted">Within {activeBudget.period}</p>}
              {activeBudget && formDate && !dateInBudget && (
                <p className="mt-1 text-xs text-red-400">Date must fall inside this budget&apos;s period.</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-subtle">Amount (negative for expense)</label>
              <input
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                type="number"
                placeholder="-0.00"
                className="w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-subtle">Description</label>
            <input
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              type="text"
              placeholder="e.g. Whole Foods Market"
              className="w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
            />
          </div>

          {!splitOn && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-subtle">Category</label>
                <button
                  type="button"
                  onClick={() => setNewCategoryOpen((v) => !v)}
                  className="text-xs font-medium text-accent hover:text-accent-hover"
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
                    className="flex-1 rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
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
                  className="w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
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
                <p className="mt-2 text-xs text-muted">
                  No categories yet.{' '}
                  <Link to="/categories" className="text-accent hover:text-accent-hover">
                    Browse suggestions
                  </Link>
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl bg-input/40 px-4 py-3">
            <span className="text-sm font-medium text-subtle">Split transaction</span>
            <button
              type="button"
              onClick={() => setSplitOn((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors ${splitOn ? 'bg-accent' : 'bg-border-muted'}`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${splitOn ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>
          {splitOn && (
            <div className="space-y-2 rounded-xl border border-border p-3">
              {splitLines.map((line, i) => (
                <div key={i} className="flex gap-2">
                  <select
                    value={line.categoryId}
                    onChange={(e) => updateSplitLine(i, { categoryId: e.target.value })}
                    className="flex-1 rounded-lg border border-border-muted bg-input px-2.5 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
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
                    className="w-28 rounded-lg border border-border-muted bg-input px-2.5 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
                  />
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addSplitLine}>
                + Add split line
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl bg-input/40 px-4 py-3">
            <span className="text-sm font-medium text-subtle">Reimbursable</span>
            <button
              type="button"
              onClick={() => setReimbursableOn((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors ${reimbursableOn ? 'bg-accent' : 'bg-border-muted'}`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${reimbursableOn ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>
          {reimbursableOn && (
            <select
              value={formReimbursable}
              onChange={(e) => setFormReimbursable(e.target.value as 'pending' | 'received')}
              className="w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
            >
              <option value="pending">Pending</option>
              <option value="received">Received</option>
            </select>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-subtle">Notes</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes"
              className="w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
            />
          </div>

          {createTransaction.isError && <p className="text-sm text-red-400">Failed to save transaction.</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => createTransaction.mutate()} disabled={createTransaction.isPending || !canSubmit}>
              {createTransaction.isPending ? 'Saving…' : 'Save Transaction'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
