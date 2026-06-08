import { useMemo, useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { ContentLoader } from '../../components/ui/Spinner'
import { CategoryIcon } from '../../components/categories/CategoryIcon'
import { useApiClient, budgetsApi, categoriesApi } from '../../api'
import { useCurrency } from '../../contexts/CurrencyContext'
import { CATEGORY_TEMPLATES } from '../../lib/categoryTemplates'
import { budgetForDate } from '../../lib/budgets'
import { IconPlus } from '../../components/ui/icons'

export function CategoryLibraryPage() {
  const client = useApiClient()
  const queryClient = useQueryClient()
  const { formatCurrency } = useCurrency()

  const [selectedBudgetId, setSelectedBudgetId] = useState('')
  const [customOpen, setCustomOpen] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customIcon, setCustomIcon] = useState('shopping')
  const [envelopePlanned, setEnvelopePlanned] = useState('')

  const [envelopeTarget, setEnvelopeTarget] = useState<{ id: string; name: string; icon?: string | null } | null>(null)
  const [envelopeAmount, setEnvelopeAmount] = useState('')
  const [libraryOnlyNotice, setLibraryOnlyNotice] = useState<string | null>(null)

  const budgetsQuery = useQuery({ queryKey: ['budgets'], queryFn: () => budgetsApi.list(client) })
  const libraryQuery = useQuery({ queryKey: ['category-library'], queryFn: () => categoriesApi.listAll(client) })

  const budgets = budgetsQuery.data ?? []
  const defaultBudgetId = useMemo(() => {
    const today = new Date().toISOString().substring(0, 10)
    return budgetForDate(budgets, today)?.id ?? budgets[0]?.id ?? ''
  }, [budgets])
  const activeBudgetId = selectedBudgetId || defaultBudgetId

  useEffect(() => {
    if (!selectedBudgetId && defaultBudgetId) {
      setSelectedBudgetId(defaultBudgetId)
    }
  }, [defaultBudgetId, selectedBudgetId])

  const envelopeQuery = useQuery({
    queryKey: ['categories', activeBudgetId],
    queryFn: () => categoriesApi.listForBudget(client, activeBudgetId),
    enabled: !!activeBudgetId,
  })

  const library = libraryQuery.data ?? []
  const envelopes = envelopeQuery.data ?? []
  const envelopeIds = useMemo(() => new Set(envelopes.map((c) => c.id)), [envelopes])
  const libraryNames = useMemo(() => new Set(library.map((c) => c.name.toLowerCase())), [library])

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
    mutationFn: (payload: { categoryId: string; name: string; icon?: string | null; planned: number }) =>
      categoriesApi.create(client, activeBudgetId, {
        name: payload.name,
        planned_amount: payload.planned,
        icon: payload.icon,
      }),
    onSuccess: invalidate,
  })

  function openEnvelopeModal(item: { id: string; name: string; icon?: string | null }) {
    setEnvelopeTarget(item)
    setEnvelopeAmount('')
  }

  /** Add suggestion to library only — envelope is optional via modal. */
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
      categoryId: envelopeTarget.id,
      name: envelopeTarget.name,
      icon: envelopeTarget.icon ?? libItem?.icon,
      planned: Number(envelopeAmount) || 0,
    })
    setEnvelopeTarget(null)
    setEnvelopeAmount('')
  }

  if (budgetsQuery.isLoading || libraryQuery.isLoading) {
    return <ContentLoader label="Loading categories…" />
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Categories</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Build your category library first, then add envelopes to any month — including mid-month. Logging a transaction can also create an envelope automatically.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {budgets.length > 0 && (
            <select
              value={activeBudgetId}
              onChange={(e) => setSelectedBudgetId(e.target.value)}
              className="h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              {budgets.map((b) => (
                <option key={b.id} value={b.id}>
                  Envelopes: {b.name}
                </option>
              ))}
            </select>
          )}
          <Button onClick={() => setCustomOpen(true)}>
            <IconPlus className="h-4 w-4" />
            Custom Category
          </Button>
        </div>
      </div>

      {/* My categories */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">My Categories</h3>
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
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatCurrency(envelope.planned)} planned
                        </p>
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
          <button
            type="button"
            onClick={() => setLibraryOnlyNotice(null)}
            className="ml-2 text-emerald-400/70 hover:text-emerald-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Templates */}
      <section>
        <CardHeader className="border-none px-0 pt-0">
          <CardTitle>Suggested Categories</CardTitle>
          <span className="text-xs text-slate-500">Adds to library — you choose whether to create an envelope</span>
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

      {/* Custom category modal */}
      {customOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setCustomOpen(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Custom Category</CardTitle>
            </CardHeader>
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
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Planned amount this month (optional)
                  </label>
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

      {/* Add to envelope modal — optional; skip to keep library-only */}
      {envelopeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setEnvelopeTarget(null)}>
          <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Add to envelope?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <CategoryIcon name={envelopeTarget.name} icon={envelopeTarget.icon} />
                <p className="text-sm text-slate-400">
                  <span className="font-medium text-slate-200">{envelopeTarget.name}</span> is in your library.
                  Add it to{' '}
                  <span className="font-medium text-slate-200">{budgets.find((b) => b.id === activeBudgetId)?.name}</span>{' '}
                  now, or skip and add later.
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
                <Button variant="secondary" onClick={() => setEnvelopeTarget(null)}>
                  Skip for now
                </Button>
                <Button onClick={submitEnvelopeModal} disabled={addToEnvelope.isPending}>
                  {addToEnvelope.isPending ? 'Adding…' : 'Add envelope'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
