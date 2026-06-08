import { useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { ContentLoader } from '../../components/ui/Spinner'
import { GoalIcon } from '../../components/goals/GoalIcon'
import { useApiClient, goalsApi } from '../../api'
import { useCurrency } from '../../contexts/CurrencyContext'
import { GOAL_TEMPLATES } from '../../lib/goalTemplates'
import { formatShortDate } from '../../lib/utils'
import { IconPlus, IconX } from '../../components/ui/icons'
import type { Goal, GoalContribution } from '../../types'

const inputClass =
  'w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-emerald-400 focus:outline-none'

export function GoalsPage() {
  const client = useApiClient()
  const queryClient = useQueryClient()
  const { formatCurrency } = useCurrency()

  const [showArchived, setShowArchived] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createIcon, setCreateIcon] = useState('emergency')
  const [createTarget, setCreateTarget] = useState('')
  const [createCurrent, setCreateCurrent] = useState('')
  const [createDate, setCreateDate] = useState('')
  const [createNotes, setCreateNotes] = useState('')

  const [detailGoal, setDetailGoal] = useState<Goal | null>(null)
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null)
  const [contributeAmount, setContributeAmount] = useState('')
  const [contributeNote, setContributeNote] = useState('')

  const [editGoal, setEditGoal] = useState<Goal | null>(null)
  const [editName, setEditName] = useState('')
  const [editTarget, setEditTarget] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const goalsQuery = useQuery({
    queryKey: ['goals', showArchived],
    queryFn: () => goalsApi.list(client, showArchived),
  })

  const contributionsQuery = useQuery({
    queryKey: ['goals', detailGoal?.id, 'contributions'],
    queryFn: () => goalsApi.listContributions(client, detailGoal!.id),
    enabled: !!detailGoal,
  })

  const goals = goalsQuery.data ?? []
  const contributions = contributionsQuery.data ?? []
  const activeGoals = useMemo(() => goals.filter((g) => !g.isArchived), [goals])
  const goalNames = useMemo(() => new Set(goals.map((g) => g.name.toLowerCase())), [goals])

  const totals = useMemo(() => {
    const saved = activeGoals.reduce((sum, g) => sum + Number(g.currentAmount), 0)
    const target = activeGoals.reduce((sum, g) => sum + Number(g.targetAmount), 0)
    return { saved, target }
  }, [activeGoals])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['goals'] })
  }

  function resetCreateForm() {
    setCreateName('')
    setCreateIcon('emergency')
    setCreateTarget('')
    setCreateCurrent('')
    setCreateDate('')
    setCreateNotes('')
  }

  function openCreateFromTemplate(template: (typeof GOAL_TEMPLATES)[0]) {
    setCreateName(template.name)
    setCreateIcon(template.icon)
    setCreateTarget(String(template.suggestedTarget))
    setCreateCurrent('')
    setCreateDate('')
    setCreateNotes('')
    setCreateOpen(true)
  }

  function openCustomCreate() {
    resetCreateForm()
    setCreateOpen(true)
  }

  function openContribute(goal: Goal) {
    setContributeGoal(goal)
    setContributeAmount('')
    setContributeNote('')
  }

  function openDetail(goal: Goal) {
    setDetailGoal(goal)
  }

  function openEdit(goal: Goal) {
    setEditGoal(goal)
    setEditName(goal.name)
    setEditTarget(String(goal.targetAmount))
    setEditDate(goal.targetDate ?? '')
    setEditNotes(goal.notes ?? '')
  }

  const createGoal = useMutation({
    mutationFn: () =>
      goalsApi.create(client, {
        name: createName.trim(),
        target_amount: Number(createTarget),
        current_amount: createCurrent ? Number(createCurrent) : 0,
        icon: createIcon,
        target_date: createDate || null,
        notes: createNotes || null,
      }),
    onSuccess: () => {
      invalidate()
      setCreateOpen(false)
      resetCreateForm()
    },
  })

  const updateGoal = useMutation({
    mutationFn: () =>
      goalsApi.update(client, editGoal!.id, {
        name: editName.trim(),
        target_amount: Number(editTarget),
        target_date: editDate || null,
        notes: editNotes || null,
      }),
    onSuccess: (updated) => {
      invalidate()
      setEditGoal(null)
      if (detailGoal?.id === updated.id) setDetailGoal(updated)
    },
  })

  const archiveGoal = useMutation({
    mutationFn: (goal: Goal) => goalsApi.update(client, goal.id, { is_archived: true }),
    onSuccess: () => {
      invalidate()
      setDetailGoal(null)
    },
  })

  const deleteGoal = useMutation({
    mutationFn: (goalId: string) => goalsApi.remove(client, goalId),
    onSuccess: () => {
      invalidate()
      setDetailGoal(null)
    },
  })

  const addContribution = useMutation({
    mutationFn: () =>
      goalsApi.addContribution(client, contributeGoal!.id, {
        amount: Number(contributeAmount),
        note: contributeNote || null,
      }),
    onSuccess: (updated) => {
      invalidate()
      setContributeGoal(null)
      setContributeAmount('')
      setContributeNote('')
      if (detailGoal?.id === updated.id) {
        setDetailGoal(updated)
        queryClient.invalidateQueries({ queryKey: ['goals', updated.id, 'contributions'] })
      }
    },
  })

  const removeContribution = useMutation({
    mutationFn: ({ goalId, contributionId }: { goalId: string; contributionId: string }) =>
      goalsApi.removeContribution(client, goalId, contributionId),
    onSuccess: (updated) => {
      invalidate()
      setDetailGoal(updated)
      queryClient.invalidateQueries({ queryKey: ['goals', updated.id, 'contributions'] })
    },
  })

  const canCreate = !!createName.trim() && !!createTarget && Number(createTarget) > 0
  const canContribute = !!contributeAmount && Number(contributeAmount) !== 0

  if (goalsQuery.isLoading) {
    return <ContentLoader label="Loading goals…" />
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-heading">Savings Goals</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Track long-term savings targets and add funds as you go.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? 'Hide archived' : 'Show archived'}
          </Button>
          <Button onClick={openCustomCreate}>
            <IconPlus className="h-4 w-4" />
            Custom Goal
          </Button>
        </div>
      </div>

      {activeGoals.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Total saved</p>
              <p className="mt-1 text-2xl font-bold text-heading">{formatCurrency(totals.saved)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Total targets</p>
              <p className="mt-1 text-2xl font-bold text-heading">{formatCurrency(totals.target)}</p>
              {totals.target > 0 && (
                <div className="mt-3">
                  <ProgressBar value={totals.saved} max={totals.target} />
                  <p className="mt-1.5 text-xs text-muted">
                    {Math.round((totals.saved / totals.target) * 100)}% across all goals
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Starter goals</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {GOAL_TEMPLATES.map((template) => {
            const exists = goalNames.has(template.name.toLowerCase())
            return (
              <button
                key={template.icon}
                type="button"
                disabled={exists}
                onClick={() => openCreateFromTemplate(template)}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface-solid px-4 py-3.5 text-left transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <GoalIcon name={template.name} icon={template.icon} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{template.name}</p>
                  <p className="text-xs text-muted">
                    {exists ? 'Already added' : `Target ${formatCurrency(template.suggestedTarget)}`}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Your goals</h3>
        {goals.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted">
              No goals yet. Pick a starter above or create a custom goal.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                formatCurrency={formatCurrency}
                onAddFunds={() => openContribute(goal)}
                onView={() => openDetail(goal)}
                onEdit={() => openEdit(goal)}
              />
            ))}
          </div>
        )}
      </section>

      {createOpen && (
        <Modal title="Create Goal" onClose={() => setCreateOpen(false)}>
          <GoalFormFields
            name={createName}
            setName={setCreateName}
            icon={createIcon}
            setIcon={setCreateIcon}
            target={createTarget}
            setTarget={setCreateTarget}
            current={createCurrent}
            setCurrent={setCreateCurrent}
            date={createDate}
            setDate={setCreateDate}
            notes={createNotes}
            setNotes={setCreateNotes}
            showCurrent
          />
          {createGoal.isError && <p className="text-sm text-red-400">Failed to create goal.</p>}
          <ModalActions
            onCancel={() => setCreateOpen(false)}
            onSubmit={() => createGoal.mutate()}
            submitLabel={createGoal.isPending ? 'Creating…' : 'Create Goal'}
            disabled={createGoal.isPending || !canCreate}
          />
        </Modal>
      )}

      {contributeGoal && (
        <Modal title={`Add funds — ${contributeGoal.name}`} onClose={() => setContributeGoal(null)}>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-subtle">Amount</label>
              <input
                value={contributeAmount}
                onChange={(e) => setContributeAmount(e.target.value)}
                type="number"
                placeholder="0.00"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-muted">Use a negative amount to withdraw.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-subtle">Note (optional)</label>
              <input
                value={contributeNote}
                onChange={(e) => setContributeNote(e.target.value)}
                type="text"
                placeholder="e.g. March paycheck"
                className={inputClass}
              />
            </div>
          </div>
          {addContribution.isError && <p className="mt-3 text-sm text-red-400">Failed to add funds.</p>}
          <ModalActions
            onCancel={() => setContributeGoal(null)}
            onSubmit={() => addContribution.mutate()}
            submitLabel={addContribution.isPending ? 'Saving…' : 'Add Funds'}
            disabled={addContribution.isPending || !canContribute}
          />
        </Modal>
      )}

      {editGoal && (
        <Modal title="Edit Goal" onClose={() => setEditGoal(null)}>
          <GoalFormFields
            name={editName}
            setName={setEditName}
            icon={editGoal.icon ?? 'emergency'}
            setIcon={() => {}}
            target={editTarget}
            setTarget={setEditTarget}
            date={editDate}
            setDate={setEditDate}
            notes={editNotes}
            setNotes={setEditNotes}
            hideIcon
          />
          {updateGoal.isError && <p className="text-sm text-red-400">Failed to save goal.</p>}
          <ModalActions
            onCancel={() => setEditGoal(null)}
            onSubmit={() => updateGoal.mutate()}
            submitLabel={updateGoal.isPending ? 'Saving…' : 'Save'}
            disabled={updateGoal.isPending || !editName.trim()}
          />
        </Modal>
      )}

      {detailGoal && (
        <Modal title={detailGoal.name} onClose={() => setDetailGoal(null)} wide>
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <GoalIcon name={detailGoal.name} icon={detailGoal.icon} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {detailGoal.isComplete && <Badge tone="success">Complete</Badge>}
                  {detailGoal.isArchived && <Badge tone="neutral">Archived</Badge>}
                </div>
                <p className="mt-2 text-sm text-muted-fg">
                  {formatCurrency(detailGoal.currentAmount)} of {formatCurrency(detailGoal.targetAmount)}
                </p>
                <div className="mt-2">
                  <ProgressBar value={detailGoal.currentAmount} max={detailGoal.targetAmount} />
                  <p className="mt-1.5 text-xs text-muted">
                    {Math.round(detailGoal.percentComplete)}% · {formatCurrency(detailGoal.remainingAmount)} remaining
                    {detailGoal.targetDate ? ` · due ${formatShortDate(detailGoal.targetDate)}` : ''}
                  </p>
                </div>
                {detailGoal.notes && <p className="mt-3 text-sm text-muted">{detailGoal.notes}</p>}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => { setDetailGoal(null); openContribute(detailGoal) }}>
                Add funds
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { setDetailGoal(null); openEdit(detailGoal) }}>
                Edit
              </Button>
              {!detailGoal.isArchived && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => archiveGoal.mutate(detailGoal)}
                  disabled={archiveGoal.isPending}
                >
                  Archive
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400"
                onClick={() => {
                  if (window.confirm('Delete this goal permanently?')) deleteGoal.mutate(detailGoal.id)
                }}
                disabled={deleteGoal.isPending}
              >
                Delete
              </Button>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-heading">Contribution history</h4>
              {contributionsQuery.isLoading ? (
                <p className="text-sm text-muted">Loading…</p>
              ) : contributions.length === 0 ? (
                <p className="text-sm text-muted">No contributions yet.</p>
              ) : (
                <ul className="max-h-48 space-y-2 overflow-y-auto">
                  {contributions.map((c) => (
                    <ContributionRow
                      key={c.id}
                      contribution={c}
                      formatCurrency={formatCurrency}
                      onRemove={() => removeContribution.mutate({ goalId: detailGoal.id, contributionId: c.id })}
                      removing={removeContribution.isPending}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function GoalCard({
  goal,
  formatCurrency,
  onAddFunds,
  onView,
  onEdit,
}: {
  goal: Goal
  formatCurrency: (n: number) => string
  onAddFunds: () => void
  onView: () => void
  onEdit: () => void
}) {
  return (
    <Card className={goal.isArchived ? 'opacity-70' : undefined}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <div className="flex min-w-0 items-center gap-3">
          <GoalIcon name={goal.name} icon={goal.icon} />
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{goal.name}</CardTitle>
            <p className="text-xs text-muted">
              {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          {goal.isComplete && <Badge tone="success">Done</Badge>}
          {goal.isArchived && <Badge tone="neutral">Archived</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <ProgressBar value={goal.currentAmount} max={goal.targetAmount} />
          <p className="mt-1.5 text-xs text-muted">
            {Math.round(goal.percentComplete)}% · {formatCurrency(goal.remainingAmount)} to go
            {goal.targetDate ? ` · due ${formatShortDate(goal.targetDate)}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!goal.isArchived && (
            <Button size="sm" onClick={onAddFunds}>
              Add funds
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onView}>
            Details
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ContributionRow({
  contribution,
  formatCurrency,
  onRemove,
  removing,
}: {
  contribution: GoalContribution
  formatCurrency: (n: number) => string
  onRemove: () => void
  removing: boolean
}) {
  const positive = contribution.amount >= 0
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl bg-input/40 px-3 py-2.5">
      <div className="min-w-0">
        <p className={`text-sm font-medium ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
          {positive ? '+' : ''}{formatCurrency(contribution.amount)}
        </p>
        <p className="text-xs text-muted">
          {formatShortDate(contribution.contributedAt)}
          {contribution.note ? ` · ${contribution.note}` : ''}
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={removing}
        className="shrink-0 text-muted hover:text-red-400"
        aria-label="Remove contribution"
      >
        <IconX className="h-4 w-4" />
      </button>
    </li>
  )
}

function GoalFormFields({
  name,
  setName,
  icon,
  setIcon,
  target,
  setTarget,
  current,
  setCurrent,
  date,
  setDate,
  notes,
  setNotes,
  showCurrent,
  hideIcon,
}: {
  name: string
  setName: (v: string) => void
  icon: string
  setIcon: (v: string) => void
  target: string
  setTarget: (v: string) => void
  current?: string
  setCurrent?: (v: string) => void
  date: string
  setDate: (v: string) => void
  notes: string
  setNotes: (v: string) => void
  showCurrent?: boolean
  hideIcon?: boolean
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-subtle">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} type="text" className={inputClass} />
      </div>
      {!hideIcon && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-subtle">Icon</label>
          <select value={icon} onChange={(e) => setIcon(e.target.value)} className={inputClass}>
            {GOAL_TEMPLATES.map((t) => (
              <option key={t.icon} value={t.icon}>{t.emoji} {t.name}</option>
            ))}
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-subtle">Target amount</label>
          <input value={target} onChange={(e) => setTarget(e.target.value)} type="number" className={inputClass} />
        </div>
        {showCurrent && setCurrent && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-subtle">Already saved</label>
            <input value={current} onChange={(e) => setCurrent(e.target.value)} type="number" placeholder="0" className={inputClass} />
          </div>
        )}
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-subtle">Target date (optional)</label>
        <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-subtle">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={inputClass}
        />
      </div>
    </div>
  )
}

function Modal({
  title,
  children,
  onClose,
  wide,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <Card className={`w-full ${wide ? 'max-w-lg' : 'max-w-md'}`} onClick={(e) => e.stopPropagation()}>
        <CardContent className="space-y-4 pt-6">
          <h3 className="text-base font-semibold text-heading">{title}</h3>
          {children}
        </CardContent>
      </Card>
    </div>
  )
}

function ModalActions({
  onCancel,
  onSubmit,
  submitLabel,
  disabled,
}: {
  onCancel: () => void
  onSubmit: () => void
  submitLabel: string
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-end gap-2 pt-1">
      <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      <Button onClick={onSubmit} disabled={disabled}>{submitLabel}</Button>
    </div>
  )
}
