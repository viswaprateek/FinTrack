import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useApiClient, budgetsApi, categoriesApi } from '../../api'
import { useCurrency } from '../../contexts/CurrencyContext'
import { ContentLoader } from '../../components/ui/Spinner'
import { IconArrowLeftRight, IconPlus } from '../../components/ui/icons'
import type { Category, RolloverType } from '../../types'

const rolloverTone: Record<RolloverType, 'neutral' | 'success' | 'info'> = {
  reset: 'neutral',
  rollover: 'success',
  capped: 'info',
}

const rolloverOptions: RolloverType[] = ['reset', 'rollover', 'capped']

export function CategoriesPage() {
  const { id } = useParams()
  const budgetId = id!
  const client = useApiClient()
  const { formatCurrency } = useCurrency()
  const queryClient = useQueryClient()

  const [moveFundsOpen, setMoveFundsOpen] = useState(false)
  const [fromCategoryId, setFromCategoryId] = useState('')
  const [toCategoryId, setToCategoryId] = useState('')
  const [moveAmount, setMoveAmount] = useState('')
  const [moveNote, setMoveNote] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addPlanned, setAddPlanned] = useState('')
  const [addRollover, setAddRollover] = useState<RolloverType>('reset')
  const [addCap, setAddCap] = useState('')

  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [editName, setEditName] = useState('')
  const [editPlanned, setEditPlanned] = useState('')
  const [editRollover, setEditRollover] = useState<RolloverType>('reset')
  const [editCap, setEditCap] = useState('')

  const budgetQuery = useQuery({ queryKey: ['budgets', budgetId], queryFn: () => budgetsApi.get(client, budgetId) })
  const categoriesQuery = useQuery({
    queryKey: ['categories', budgetId],
    queryFn: () => categoriesApi.listForBudget(client, budgetId),
  })
  const categories = categoriesQuery.data ?? []

  useEffect(() => {
    if (categories.length > 0 && (!fromCategoryId || !toCategoryId)) {
      setFromCategoryId(categories[0].id)
      setToCategoryId(categories[1]?.id ?? categories[0].id)
    }
  }, [categories, fromCategoryId, toCategoryId])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['categories', budgetId] })
    queryClient.invalidateQueries({ queryKey: ['budgets'] })
  }

  const createCategory = useMutation({
    mutationFn: () =>
      categoriesApi.create(client, budgetId, {
        name: addName,
        planned_amount: Number(addPlanned || 0),
        rollover_type: addRollover,
        rollover_cap: addRollover === 'capped' && addCap ? Number(addCap) : null,
      }),
    onSuccess: () => {
      invalidate()
      setAddOpen(false)
      setAddName('')
      setAddPlanned('')
      setAddRollover('reset')
      setAddCap('')
    },
  })

  const updateCategory = useMutation({
    mutationFn: () =>
      categoriesApi.update(client, budgetId, editTarget!.id, {
        name: editName,
        planned_amount: Number(editPlanned || 0),
        rollover_type: editRollover,
        rollover_cap: editRollover === 'capped' && editCap ? Number(editCap) : null,
      }),
    onSuccess: () => {
      invalidate()
      setEditTarget(null)
    },
  })

  const moveFunds = useMutation({
    mutationFn: () =>
      categoriesApi.moveFunds(client, budgetId, {
        from_category_id: fromCategoryId,
        to_category_id: toCategoryId,
        amount: Number(moveAmount),
        note: moveNote || null,
      }),
    onSuccess: () => {
      invalidate()
      setMoveFundsOpen(false)
      setMoveAmount('')
      setMoveNote('')
    },
  })

  function openEdit(c: Category) {
    setEditTarget(c)
    setEditName(c.name)
    setEditPlanned(String(c.planned))
    setEditRollover(c.rolloverType)
    setEditCap(c.rolloverCap != null ? String(c.rolloverCap) : '')
  }

  if (budgetQuery.isLoading || categoriesQuery.isLoading) {
    return <ContentLoader label="Loading categories…" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Categories — {budgetQuery.data?.name ?? ''}</h2>
          <p className="mt-1 text-sm text-slate-500">Manage envelopes, planned amounts, and rollover rules.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setMoveFundsOpen(true)} disabled={categories.length < 2}>
            <IconArrowLeftRight className="h-4 w-4" />
            Move Funds
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <IconPlus className="h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      {categories.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Envelopes</CardTitle>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <IconPlus className="h-4 w-4" />
              Add Category
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Planned</th>
                  <th className="px-6 py-3 font-medium">Spent</th>
                  <th className="px-6 py-3 font-medium">Available</th>
                  <th className="px-6 py-3 font-medium">Rollover</th>
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => {
                  const available = c.planned - c.spent
                  return (
                    <tr key={c.id} className="border-b border-slate-800/60 last:border-0">
                      <td className="px-6 py-3.5 font-medium text-slate-200">{c.name}</td>
                      <td className="px-6 py-3.5 text-slate-400">{formatCurrency(c.planned)}</td>
                      <td className="px-6 py-3.5 text-slate-400">{formatCurrency(c.spent)}</td>
                      <td className={`px-6 py-3.5 font-medium ${available < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {formatCurrency(available)}
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge tone={rolloverTone[c.rolloverType]}>
                          {c.rolloverType}
                          {c.rolloverType === 'capped' && c.rolloverCap ? ` · cap ${formatCurrency(c.rolloverCap)}` : ''}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>Edit</Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-sm font-medium text-slate-200">Add your first category to start budgeting</p>
            <Button className="mt-4" onClick={() => setAddOpen(true)}>
              <IconPlus className="h-4 w-4" />
              Add Category
            </Button>
          </CardContent>
        </Card>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setAddOpen(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Add Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Name</label>
                <input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  type="text"
                  placeholder="e.g. Groceries"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Planned amount</label>
                <input
                  value={addPlanned}
                  onChange={(e) => setAddPlanned(e.target.value)}
                  type="number"
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Rollover type</label>
                <select
                  value={addRollover}
                  onChange={(e) => setAddRollover(e.target.value as RolloverType)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                >
                  {rolloverOptions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              {addRollover === 'capped' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Rollover cap</label>
                  <input
                    value={addCap}
                    onChange={(e) => setAddCap(e.target.value)}
                    type="number"
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              )}
              {createCategory.isError && <p className="text-sm text-red-400">Failed to add category.</p>}
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button onClick={() => createCategory.mutate()} disabled={createCategory.isPending || !addName}>
                  {createCategory.isPending ? 'Saving…' : 'Add Category'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setEditTarget(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Edit Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  type="text"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Planned amount</label>
                <input
                  value={editPlanned}
                  onChange={(e) => setEditPlanned(e.target.value)}
                  type="number"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Rollover type</label>
                <select
                  value={editRollover}
                  onChange={(e) => setEditRollover(e.target.value as RolloverType)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                >
                  {rolloverOptions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              {editRollover === 'capped' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Rollover cap</label>
                  <input
                    value={editCap}
                    onChange={(e) => setEditCap(e.target.value)}
                    type="number"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              )}
              {updateCategory.isError && <p className="text-sm text-red-400">Failed to save category.</p>}
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
                <Button onClick={() => updateCategory.mutate()} disabled={updateCategory.isPending || !editName}>
                  {updateCategory.isPending ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {moveFundsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setMoveFundsOpen(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Move Funds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">From envelope</label>
                <select
                  value={fromCategoryId}
                  onChange={(e) => setFromCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">To envelope</label>
                <select
                  value={toCategoryId}
                  onChange={(e) => setToCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Amount</label>
                <input
                  value={moveAmount}
                  onChange={(e) => setMoveAmount(e.target.value)}
                  type="number"
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Note</label>
                <input
                  value={moveNote}
                  onChange={(e) => setMoveNote(e.target.value)}
                  type="text"
                  placeholder="Optional note for the audit log"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              {moveFunds.isError && <p className="text-sm text-red-400">Failed to move funds.</p>}
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="secondary" onClick={() => setMoveFundsOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => moveFunds.mutate()}
                  disabled={
                    moveFunds.isPending ||
                    !moveAmount ||
                    !fromCategoryId ||
                    !toCategoryId ||
                    fromCategoryId === toCategoryId
                  }
                >
                  {moveFunds.isPending ? 'Moving…' : 'Move Funds'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
