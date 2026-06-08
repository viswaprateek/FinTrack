import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { ContentLoader } from '../../components/ui/Spinner'
import { CategoryIcon } from '../../components/categories/CategoryIcon'
import { useApiClient, categoriesApi } from '../../api'
import { useBudgetPeriod } from '../../contexts/BudgetPeriodContext'
import { useCurrency } from '../../contexts/CurrencyContext'
import { CATEGORY_TEMPLATES } from '../../lib/categoryTemplates'
import { IconArrowLeftRight, IconPlus } from '../../components/ui/icons'
import type { Category, RolloverType } from '../../types'

const rolloverTone: Record<RolloverType, 'neutral' | 'success' | 'info'> = {
  reset: 'neutral',
  rollover: 'success',
  capped: 'info',
}

const rolloverOptions: RolloverType[] = ['reset', 'rollover', 'capped']

export function CategoryLibraryPage() {
  const client = useApiClient()
  const queryClient = useQueryClient()
  const { formatCurrency } = useCurrency()
  const { currentBudget, isLoading: budgetsLoading } = useBudgetPeriod()
  const activeBudgetId = currentBudget?.id ?? ''

  const [customOpen, setCustomOpen] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customIcon, setCustomIcon] = useState('shopping')
  const [envelopePlanned, setEnvelopePlanned] = useState('')

  const [envelopeTarget, setEnvelopeTarget] = useState<{ id: string; name: string; icon?: string | null } | null>(null)
  const [envelopeAmount, setEnvelopeAmount] = useState('')
  const [libraryOnlyNotice, setLibraryOnlyNotice] = useState<string | null>(null)

  const [moveFundsOpen, setMoveFundsOpen] = useState(false)
  const [fromCategoryId, setFromCategoryId] = useState('')
  const [toCategoryId, setToCategoryId] = useState('')
  const [moveAmount, setMoveAmount] = useState('')
  const [moveNote, setMoveNote] = useState('')

  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [editPlanned, setEditPlanned] = useState('')
  const [editRollover, setEditRollover] = useState<RolloverType>('reset')
  const [editCap, setEditCap] = useState('')

  const libraryQuery = useQuery({ queryKey: ['category-library'], queryFn: () => categoriesApi.listAll(client) })
  const envelopeQuery = useQuery({
    queryKey: ['categories', activeBudgetId],
    queryFn: () => categoriesApi.listForBudget(client, activeBudgetId),
    enabled: !!activeBudgetId,
  })

  const library = libraryQuery.data ?? []
  const envelopes = envelopeQuery.data ?? []
  const envelopeIds = useMemo(() => new Set(envelopes.map((c) => c.id)), [envelopes])
  const libraryNames = useMemo(() => new Set(library.map((c) => c.name.toLowerCase())), [library])

  useEffect(() => {
    if (envelopes.length > 0 && (!fromCategoryId || !toCategoryId)) {
      setFromCategoryId(envelopes[0].id)
      setToCategoryId(envelopes[1]?.id ?? envelopes[0].id)
    }
  }, [envelopes, fromCategoryId, toCategoryId])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['category-library'] })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    queryClient.invalidateQueries({ queryKey: ['budgets'] })
  }

  const addToLibrary = useMutation({
    mutationFn: (payload: { name: string; icon: string }) => categoriesApi.createLibrary(client, payload),
    onSuccess: invalidate,
  })

  const addToEnvelope = useMutation({
    mutationFn: (payload: { name: string; icon?: string | null; planned: number }) =>
      categoriesApi.create(client, activeBudgetId, {
        name: payload.name,
        planned_amount: payload.planned,
        icon: payload.icon,
      }),
    onSuccess: invalidate,
  })

  const updateCategory = useMutation({
    mutationFn: () =>
      categoriesApi.update(client, activeBudgetId, editTarget!.id, {
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
      categoriesApi.moveFunds(client, activeBudgetId, {
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

  function openEnvelopeModal(item: { id: string; name: string; icon?: string | null }) {
    setEnvelopeTarget(item)
    setEnvelopeAmount('')
  }

  function openEditEnvelope(c: Category) {
    setEditTarget(c)
    setEditPlanned(String(c.planned))
    setEditRollover(c.rolloverType)
    setEditCap(c.rolloverCap != null ? String(c.rolloverCap) : '')
  }

  async function addTemplateToLibrary(template: (typeof CATEGORY_TEMPLATES)[0]) {
    const existing = library.find((c) => c.name.toLowerCase() === template.name.toLowerCase())
    if (existing) {
      if (!envelopeIds.has(existing.id) && activeBudgetId) {
        openEnvelopeModal({ id: existing.id, name: existing.name, icon: existing.icon })
      }
      return
    }

    const item = await addToLibrary.mutateAsync({ name: template.name, icon: template.icon })
    if (activeBudgetId) {
      openEnvelopeModal({ id: item.id, name: item.name, icon: item.icon })
    } else {
      setLibraryOnlyNotice(`${item.name} added to your library. Create a budget to add envelopes.`)
    }
  }

  async function submitCustom() {
    if (!customName.trim()) return
    const item = await addToLibrary.mutateAsync({ name: customName.trim(), icon: customIcon })
    setCustomOpen(false)
    setCustomName('')
    setEnvelopePlanned('')
    if (activeBudgetId) {
      openEnvelopeModal({ id: item.id, name: item.name, icon: item.icon })
      if (envelopePlanned) setEnvelopeAmount(envelopePlanned)
    }
  }

  async function submitEnvelopeModal() {
    if (!envelopeTarget || !activeBudgetId) return
    const libItem = library.find((c) => c.id === envelopeTarget.id)
    await addToEnvelope.mutateAsync({
      name: envelopeTarget.name,
      icon: envelopeTarget.icon ?? libItem?.icon,
      planned: Number(envelopeAmount) || 0,
    })
    setEnvelopeTarget(null)
    setEnvelopeAmount('')
  }

  if (budgetsLoading || libraryQuery.isLoading) {
    return <ContentLoader label="Loading categories…" />
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Categories</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            {currentBudget
              ? `Managing library and envelopes for ${currentBudget.period}. Change month from the header.`
              : 'Build your category library, then create a budget to add monthly envelopes.'}
          </p>
        </div>
        <Button onClick={() => setCustomOpen(true)}>
          <IconPlus className="h-4 w-4" />
          Custom Category
        </Button>
      </div>

      {/* This month's envelopes */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            This month&apos;s envelopes
            {currentBudget ? ` · ${currentBudget.name}` : ''}
          </h3>
          {currentBudget && envelopes.length >= 2 && (
            <Button variant="secondary" size="sm" onClick={() => setMoveFundsOpen(true)}>
              <IconArrowLeftRight className="h-4 w-4" />
              Move Funds
            </Button>
          )}
        </div>

        {!currentBudget ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-slate-500">
              <Link to="/budgets" className="font-medium text-emerald-400 hover:text-emerald-300">
                Create a monthly budget
              </Link>{' '}
              to plan envelopes.
            </CardContent>
          </Card>
        ) : envelopes.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-3 font-medium">Category</th>
                    <th className="px-6 py-3 font-medium">Planned</th>
                    <th className="px-6 py-3 font-medium">Spent</th>
                    <th className="px-6 py-3 font-medium">Available</th>
                    <th className="px-6 py-3 font-medium">Rollover</th>
                    <th className="px-6 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {envelopes.map((c) => {
                    const available = c.planned - c.spent
                    const libItem = library.find((l) => l.id === c.id)
                    return (
                      <tr key={c.id} className="border-b border-slate-800/60 last:border-0">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2 font-medium text-slate-200">
                            <CategoryIcon name={c.name} icon={libItem?.icon} size="sm" />
                            {c.name}
                          </div>
                        </td>
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
                          <Button variant="ghost" size="sm" onClick={() => openEditEnvelope(c)}>Edit</Button>
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
            <CardContent className="py-8 text-center text-sm text-slate-500">
              No envelopes for this month yet. Add categories from your library below.
            </CardContent>
          </Card>
        )}
      </section>

      {/* My library */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">My library</h3>
        {library.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {library.map((cat) => {
              const inEnvelope = envelopeIds.has(cat.id)
              const envelope = envelopes.find((e) => e.id === cat.id)
              return (
                <Card key={cat.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <CategoryIcon name={cat.name} icon={cat.icon} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-200">{cat.name}</p>
                      {inEnvelope && envelope ? (
                        <p className="mt-0.5 text-xs text-slate-500">{formatCurrency(envelope.planned)} planned</p>
                      ) : (
                        <p className="mt-0.5 text-xs text-slate-600">Not in this month</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    {inEnvelope ? (
                      <Badge tone="success">In envelope</Badge>
                    ) : activeBudgetId ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full"
                        onClick={() => openEnvelopeModal({ id: cat.id, name: cat.name, icon: cat.icon })}
                      >
                        Add to envelope
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-600">Create a budget first</span>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-sm text-slate-500">
              No categories yet. Pick from suggestions below or create your own.
            </CardContent>
          </Card>
        )}
      </section>

      {libraryOnlyNotice && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
          {libraryOnlyNotice}
          <button type="button" onClick={() => setLibraryOnlyNotice(null)} className="ml-2 text-emerald-400/70 hover:text-emerald-300">
            Dismiss
          </button>
        </div>
      )}

      <section>
        <CardHeader className="border-none px-0 pt-0">
          <CardTitle>Suggested categories</CardTitle>
          <span className="text-xs text-slate-500">Adds to library — envelope is optional</span>
        </CardHeader>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {CATEGORY_TEMPLATES.map((t) => {
            const inLibrary = libraryNames.has(t.name.toLowerCase())
            const libItem = library.find((c) => c.name.toLowerCase() === t.name.toLowerCase())
            const inEnvelope = libItem ? envelopeIds.has(libItem.id) : false

            return (
              <button
                key={t.icon}
                type="button"
                onClick={() => addTemplateToLibrary(t)}
                disabled={addToLibrary.isPending || inEnvelope}
                className="flex flex-col items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-center transition-colors hover:border-slate-700 hover:bg-slate-800/60 disabled:cursor-default disabled:opacity-60"
              >
                <CategoryIcon name={t.name} icon={t.icon} size="lg" />
                <span className="text-sm font-medium text-slate-200">{t.name}</span>
                {inEnvelope ? (
                  <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-400">In envelope</span>
                ) : inLibrary ? (
                  <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">In library</span>
                ) : null}
              </button>
            )
          })}
        </div>
      </section>

      {customOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setCustomOpen(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader><CardTitle>Custom Category</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Name</label>
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Gym"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_TEMPLATES.slice(0, 8).map((t) => (
                    <button
                      key={t.icon}
                      type="button"
                      onClick={() => setCustomIcon(t.icon)}
                      className={`rounded-xl p-1 ${customIcon === t.icon ? 'ring-2 ring-emerald-400' : ''}`}
                    >
                      <CategoryIcon name={t.name} icon={t.icon} size="sm" />
                    </button>
                  ))}
                </div>
              </div>
              {activeBudgetId && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Planned amount this month (optional)</label>
                  <input
                    value={envelopePlanned}
                    onChange={(e) => setEnvelopePlanned(e.target.value)}
                    type="number"
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setCustomOpen(false)}>Cancel</Button>
                <Button onClick={submitCustom} disabled={!customName.trim() || addToLibrary.isPending}>
                  {addToLibrary.isPending ? 'Adding…' : 'Add Category'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {envelopeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setEnvelopeTarget(null)}>
          <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <CardHeader><CardTitle>Add to envelope?</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <CategoryIcon name={envelopeTarget.name} icon={envelopeTarget.icon} />
                <p className="text-sm text-slate-400">
                  <span className="font-medium text-slate-200">{envelopeTarget.name}</span> is in your library.
                  Add it to <span className="font-medium text-slate-200">{currentBudget?.name}</span> now, or skip.
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Planned amount this month</label>
                <input
                  value={envelopeAmount}
                  onChange={(e) => setEnvelopeAmount(e.target.value)}
                  type="number"
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setEnvelopeTarget(null)}>Skip for now</Button>
                <Button onClick={submitEnvelopeModal} disabled={addToEnvelope.isPending}>
                  {addToEnvelope.isPending ? 'Adding…' : 'Add envelope'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setEditTarget(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader><CardTitle>Edit envelope — {editTarget.name}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
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
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
                <Button onClick={() => updateCategory.mutate()} disabled={updateCategory.isPending}>
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
            <CardHeader><CardTitle>Move Funds</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">From envelope</label>
                <select
                  value={fromCategoryId}
                  onChange={(e) => setFromCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                >
                  {envelopes.map((c) => (
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
                  {envelopes.map((c) => (
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
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Note</label>
                <input
                  value={moveNote}
                  onChange={(e) => setMoveNote(e.target.value)}
                  type="text"
                  placeholder="Optional"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setMoveFundsOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => moveFunds.mutate()}
                  disabled={moveFunds.isPending || !moveAmount || fromCategoryId === toCategoryId}
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
