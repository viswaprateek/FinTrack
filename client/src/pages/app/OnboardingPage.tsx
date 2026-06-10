import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { Button } from '../../components/ui/Button'
import { Logo } from '../../components/ui/Logo'
import { PageLoader } from '../../components/ui/Spinner'
import { CategoryIcon } from '../../components/categories/CategoryIcon'
import {
  useApiClient,
  onboardingApi,
  usersApi,
  budgetsApi,
  categoriesApi,
  transactionsApi,
} from '../../api'
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from '../../lib/currencies'
import {
  clearOnboardingDraft,
  readOnboardingDraft,
  writeOnboardingDraft,
  type EnvelopeDraft,
  type OnboardingStep,
  type TransactionDraft,
} from '../../lib/onboardingDraft'
import { budgetForCalendarMonth, monthlyBudgetPeriod } from '../../lib/budgets'
import { TransactionTypeToggle, type TransactionType } from '../../components/transactions/TransactionTypeToggle'
import { IconArrowRight, IconCheck, IconSparkles, IconTrash, IconWallet } from '../../components/ui/icons'
import { cn } from '../../lib/utils'
import { OnboardingProgress } from './onboarding/OnboardingProgress'
import { OnboardingStepPanel } from './onboarding/OnboardingStepPanel'
import { inputClass, ONBOARDING_ENVELOPE_TEMPLATES } from './onboarding/constants'

const STORAGE_BUDGET_KEY = 'active_budget_id'

interface EnvelopeCategory {
  id: string
  name: string
  icon?: string | null
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function emptyTransactionDraft(categories: EnvelopeCategory[], type: 'income' | 'expense'): TransactionDraft {
  const preferred =
    type === 'expense'
      ? categories.find((c) => c.name.toLowerCase() !== 'salary') ?? categories[0]
      : categories.find((c) => c.name.toLowerCase() === 'salary')

  return {
    type,
    categoryId: preferred?.id ?? '',
    categoryName: preferred?.name ?? '',
    description: type === 'income' ? 'Monthly salary' : '',
    amount: '',
    date: todayIso(),
  }
}

export function OnboardingPage() {
  const client = useApiClient()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useUser()

  const storedDraft = useMemo(() => readOnboardingDraft(), [])

  const [step, setStep] = useState<OnboardingStep>(storedDraft?.step ?? 'welcome')
  const [currency, setCurrency] = useState(storedDraft?.currency ?? DEFAULT_CURRENCY)
  const [budgetId, setBudgetId] = useState<string | null>(storedDraft?.budgetId ?? null)
  const [envelopeDrafts, setEnvelopeDrafts] = useState<EnvelopeDraft[]>(storedDraft?.envelopes ?? [])
  const [transactionDrafts, setTransactionDrafts] = useState<TransactionDraft[]>(storedDraft?.transactions ?? [])
  const [envelopeCategories, setEnvelopeCategories] = useState<EnvelopeCategory[]>([])
  const [pendingEnvelope, setPendingEnvelope] = useState<EnvelopeDraft | null>(null)
  const [transactionForm, setTransactionForm] = useState<TransactionDraft | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)
  const [resumeChecked, setResumeChecked] = useState(false)

  const now = new Date()
  const currentPeriod = monthlyBudgetPeriod(now.getFullYear(), now.getMonth() + 1)

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => usersApi.getMe(client),
  })

  const budgetsQuery = useQuery({
    queryKey: ['budgets'],
    queryFn: () => budgetsApi.list(client),
    enabled: !!meQuery.data && !meQuery.data.onboardingCompleted,
  })

  const persistDraft = useCallback(() => {
    writeOnboardingDraft({
      step,
      currency,
      budgetId,
      envelopes: envelopeDrafts,
      transactions: transactionDrafts,
    })
  }, [step, currency, budgetId, envelopeDrafts, transactionDrafts])

  useEffect(() => {
    persistDraft()
  }, [persistDraft])

  const loadEnvelopeCategories = useCallback(
    async (id: string) => {
      const cats = await categoriesApi.listForBudget(client, id)
      const mapped = cats.map((c) => ({ id: c.id, name: c.name }))
      setEnvelopeCategories(mapped)
      return mapped
    },
    [client],
  )

  useEffect(() => {
    if (resumeChecked || budgetsQuery.isLoading || meQuery.isLoading) return

    async function resume() {
      const budgets = budgetsQuery.data ?? []
      const existing = budgetForCalendarMonth(budgets, now.getFullYear(), now.getMonth() + 1)

      if (existing) {
        setBudgetId(existing.id)
        localStorage.setItem(STORAGE_BUDGET_KEY, existing.id)
        const cats = await loadEnvelopeCategories(existing.id)

        if (!storedDraft?.step || storedDraft.step === 'welcome') {
          if (cats.length > 0) setStep('transactions')
          else setStep('envelopes')
        }

        if (meQuery.data?.default_currency) {
          setCurrency(meQuery.data.default_currency)
        }
      } else if (meQuery.data?.default_currency) {
        setCurrency(meQuery.data.default_currency)
      }

      setResumeChecked(true)
    }

    void resume()
  }, [
    budgetsQuery.data,
    budgetsQuery.isLoading,
    meQuery.data,
    meQuery.isLoading,
    resumeChecked,
    storedDraft?.step,
    loadEnvelopeCategories,
    now,
  ])

  useEffect(() => {
    if (envelopeCategories.length === 0) return
    setTransactionForm((prev) => prev ?? emptyTransactionDraft(envelopeCategories, 'expense'))
  }, [envelopeCategories])

  const complete = useMutation({
    mutationFn: () => onboardingApi.complete(client, { default_currency: currency }),
    onSuccess: () => {
      clearOnboardingDraft()
      queryClient.invalidateQueries({ queryKey: ['me'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['category-library'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      navigate('/dashboard', { replace: true })
    },
  })

  if (meQuery.isLoading || budgetsQuery.isLoading || !resumeChecked) {
    return <PageLoader label="Loading…" />
  }

  if (meQuery.data?.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />
  }

  const firstName = user?.firstName || meQuery.data?.first_name || 'there'

  function goTo(next: OnboardingStep) {
    setStepError(null)
    setStep(next)
  }

  async function handleCurrencyNext() {
    setIsSaving(true)
    setStepError(null)
    try {
      await usersApi.updatePreferences(client, { default_currency: currency })
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      goTo('budget')
    } catch {
      setStepError('Could not save your currency. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function ensureBudget(): Promise<string | null> {
    if (budgetId) return budgetId

    const budgets = await budgetsApi.list(client)
    const existing = budgetForCalendarMonth(budgets, now.getFullYear(), now.getMonth() + 1)
    if (existing) {
      setBudgetId(existing.id)
      localStorage.setItem(STORAGE_BUDGET_KEY, existing.id)
      return existing.id
    }

    const budget = await budgetsApi.create(client, {
      name: currentPeriod.name,
      period_start: currentPeriod.periodStart,
      period_end: currentPeriod.periodEnd,
    })
    setBudgetId(budget.id)
    localStorage.setItem(STORAGE_BUDGET_KEY, budget.id)
    await queryClient.invalidateQueries({ queryKey: ['budgets'] })
    return budget.id
  }

  async function handleBudgetNext(skip = false) {
    setIsSaving(true)
    setStepError(null)
    try {
      if (!skip) {
        await ensureBudget()
      }
      goTo('envelopes')
    } catch {
      setStepError('Could not create your budget. It may already exist for this month.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleEnvelopesNext(skip = false) {
    setIsSaving(true)
    setStepError(null)
    try {
      let activeBudgetId = budgetId

      if (!skip && envelopeDrafts.length > 0) {
        activeBudgetId = await ensureBudget()
        if (!activeBudgetId) throw new Error('No budget')

        const existing = await categoriesApi.listForBudget(client, activeBudgetId)
        const existingNames = new Set(existing.map((c) => c.name.toLowerCase()))

        for (const env of envelopeDrafts) {
          if (existingNames.has(env.name.toLowerCase())) continue
          await categoriesApi.create(client, activeBudgetId, {
            name: env.name,
            icon: env.icon,
            planned_amount: Number(env.planned) || 0,
          })
        }

        await queryClient.invalidateQueries({ queryKey: ['categories'] })
        await queryClient.invalidateQueries({ queryKey: ['category-library'] })
        await queryClient.invalidateQueries({ queryKey: ['budgets'] })
        setEnvelopeDrafts([])
      }

      if (activeBudgetId) {
        await loadEnvelopeCategories(activeBudgetId)
      }

      goTo('transactions')
    } catch {
      setStepError('Could not save your envelopes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleFinish(skip = false) {
    setIsSaving(true)
    setStepError(null)
    try {
      const activeBudgetId = skip ? budgetId : budgetId ?? (await ensureBudget())

      if (!skip && transactionDrafts.length > 0 && activeBudgetId) {
        for (const tx of transactionDrafts) {
          const amount = Number(tx.amount)
          if (!amount || !tx.description.trim()) continue
          await transactionsApi.create(client, {
            budget_id: activeBudgetId,
            category_id: tx.categoryId || null,
            date: tx.date,
            description: tx.description.trim(),
            amount,
            type: tx.type,
          })
        }
        await queryClient.invalidateQueries({ queryKey: ['transactions'] })
        await queryClient.invalidateQueries({ queryKey: ['budgets'] })
      }

      await complete.mutateAsync()
    } catch {
      setStepError('Something went wrong finishing setup. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  function addEnvelopeFromTemplate(name: string, icon: string) {
    if (envelopeDrafts.some((e) => e.name.toLowerCase() === name.toLowerCase())) return
    setPendingEnvelope({ name, icon, planned: '' })
  }

  function confirmPendingEnvelope() {
    if (!pendingEnvelope) return
    setEnvelopeDrafts((prev) => [...prev, pendingEnvelope])
    setPendingEnvelope(null)
  }

  function removeEnvelopeDraft(name: string) {
    setEnvelopeDrafts((prev) => prev.filter((e) => e.name !== name))
  }

  function addTransactionToList(form: TransactionDraft) {
    const amount = Number(form.amount)
    if (!amount || !form.description.trim()) return false
    if (form.type === 'expense' && !form.categoryId) return false
    setTransactionDrafts((prev) => [...prev, { ...form, amount: String(amount) }])
    return true
  }

  function removeTransaction(index: number) {
    setTransactionDrafts((prev) => prev.filter((_, i) => i !== index))
  }

  function applyTransactionType(form: TransactionDraft, type: TransactionType): TransactionDraft {
    const defaults = emptyTransactionDraft(envelopeCategories, type)
    return {
      ...form,
      type,
      categoryId: defaults.categoryId,
      categoryName: defaults.categoryName,
      description: form.description.trim() ? form.description : defaults.description,
    }
  }

  const hasIncomeDraft = transactionDrafts.some((tx) => tx.type === 'income')
  const hasExpenseDraft = transactionDrafts.some((tx) => tx.type === 'expense')

  const pendingBusy = isSaving || complete.isPending

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border/80 px-6 py-5">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <Logo />
          <span className="text-lg font-bold tracking-tight text-heading">FinTrack</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-10">
        <OnboardingProgress step={step} />

        <OnboardingStepPanel stepKey={step}>
          {step === 'welcome' && (
            <div className="space-y-6 text-center">
              <motion.div
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-muted text-accent"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <IconSparkles className="h-7 w-7" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-heading">Welcome, {firstName}</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  We&apos;ll set up your first month together — a budget, a few envelopes, and your first
                  transactions. It only takes a couple of minutes.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-muted/40 px-4 py-3 text-left text-xs leading-relaxed text-muted-fg">
                <p className="font-medium text-subtle">What is envelope budgeting?</p>
                <p className="mt-1">
                  You give every dollar a job — rent, groceries, savings — so you always know what&apos;s left to spend.
                </p>
              </div>
              <Button className="w-full" onClick={() => goTo('currency')}>
                Let&apos;s go
                <IconArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 'currency' && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-heading">Pick your currency</h1>
                <p className="mt-2 text-sm text-muted">
                  Amounts across the app will display in this currency. You can change it later in Settings.
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-subtle">Default currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={inputClass}
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              {stepError && <p className="text-center text-sm text-red-400">{stepError}</p>}
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => goTo('welcome')} disabled={pendingBusy}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => void handleCurrencyNext()} disabled={pendingBusy}>
                  {isSaving ? 'Saving…' : 'Continue'}
                </Button>
              </div>
            </div>
          )}

          {step === 'budget' && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-heading">Create your monthly budget</h1>
                <p className="mt-2 text-sm text-muted">
                  A budget is one calendar month — your workspace for planning and tracking spending.
                </p>
              </div>

              <motion.div
                className="rounded-2xl border border-accent/30 bg-accent-muted p-5"
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05 }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-muted text-accent">
                    <IconWallet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-heading">{currentPeriod.name}</p>
                    <p className="mt-1 text-sm text-muted">
                      {currentPeriod.periodStart} → {currentPeriod.periodEnd}
                    </p>
                    {budgetId && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-success">
                        <IconCheck className="h-3.5 w-3.5" />
                        Already created
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>

              {stepError && <p className="text-center text-sm text-red-400">{stepError}</p>}

              <div className="flex flex-col gap-3">
                <Button className="w-full" onClick={() => void handleBudgetNext(false)} disabled={pendingBusy}>
                  {isSaving ? 'Creating…' : budgetId ? 'Continue' : 'Create budget'}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-muted"
                  onClick={() => void handleBudgetNext(true)}
                  disabled={pendingBusy}
                >
                  Skip for now
                </Button>
                <Button variant="secondary" onClick={() => goTo('currency')} disabled={pendingBusy}>
                  Back
                </Button>
              </div>
            </div>
          )}

          {step === 'envelopes' && (
            <div className="space-y-5">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-heading">Set up your envelopes</h1>
                <p className="mt-2 text-sm text-muted">
                  Envelopes are spending categories with a planned amount — like Groceries or Rent.
                </p>
              </div>

              {!budgetId && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/90">
                  You&apos;ll need a budget first.{' '}
                  <button
                    type="button"
                    className="font-medium underline hover:text-amber-100"
                    onClick={() => void handleBudgetNext(false)}
                    disabled={pendingBusy}
                  >
                    Create {currentPeriod.name} budget
                  </button>
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Suggested envelopes</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ONBOARDING_ENVELOPE_TEMPLATES.map((t, i) => {
                    const added = envelopeDrafts.some((e) => e.name === t.name)
                    return (
                      <motion.button
                        key={t.icon}
                        type="button"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => addEnvelopeFromTemplate(t.name, t.icon)}
                        disabled={added || pendingBusy}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-colors',
                          added
                            ? 'border-accent/40 bg-accent-muted opacity-70'
                            : 'border-border hover:border-accent/30 hover:bg-hover/50',
                        )}
                      >
                        <CategoryIcon name={t.name} icon={t.icon} size="sm" />
                        <span className="text-xs font-medium text-foreground">{t.name}</span>
                        {added && <span className="text-[10px] text-success">Added</span>}
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {pendingEnvelope && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="rounded-2xl border border-border bg-surface-muted/30 p-4"
                >
                  <p className="mb-3 text-sm font-medium text-subtle">
                    How much do you plan for <span className="text-heading">{pendingEnvelope.name}</span> this month?
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={pendingEnvelope.planned}
                      onChange={(e) =>
                        setPendingEnvelope((p) => (p ? { ...p, planned: e.target.value } : p))
                      }
                      className={inputClass}
                      autoFocus
                    />
                    <Button onClick={confirmPendingEnvelope}>Add</Button>
                    <Button variant="secondary" onClick={() => setPendingEnvelope(null)}>
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}

              {envelopeDrafts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Your envelopes</p>
                  {envelopeDrafts.map((env) => (
                    <div
                      key={env.name}
                      className="flex items-center justify-between rounded-xl border border-border bg-surface-solid/40 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <CategoryIcon name={env.name} icon={env.icon} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{env.name}</p>
                          <p className="text-xs text-muted">{env.planned || '0'} planned</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEnvelopeDraft(env.name)}
                        className="rounded-lg p-1.5 text-muted hover:bg-hover hover:text-red-400"
                        aria-label={`Remove ${env.name}`}
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {stepError && <p className="text-center text-sm text-red-400">{stepError}</p>}

              <div className="flex flex-col gap-3">
                <Button
                  className="w-full"
                  onClick={() => void handleEnvelopesNext(false)}
                  disabled={pendingBusy || (!budgetId && envelopeDrafts.length > 0)}
                >
                  {isSaving ? 'Saving…' : envelopeDrafts.length > 0 ? 'Save & continue' : 'Continue'}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-muted"
                  onClick={() => void handleEnvelopesNext(true)}
                  disabled={pendingBusy}
                >
                  Skip for now
                </Button>
                <Button variant="secondary" onClick={() => goTo('budget')} disabled={pendingBusy}>
                  Back
                </Button>
              </div>
            </div>
          )}

          {step === 'transactions' && (
            <div className="space-y-5">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-heading">Log your first transactions</h1>
                <p className="mt-2 text-sm text-muted">
                  Add one income and one expense — use the toggle to switch between them. Income is
                  money received; only expenses need an envelope.
                </p>
              </div>

              {budgetId && (
                <div className="flex flex-wrap justify-center gap-4 text-xs">
                  <span className={hasIncomeDraft ? 'font-medium text-emerald-400' : 'text-muted'}>
                    {hasIncomeDraft ? '✓' : '○'} Income added
                  </span>
                  <span className={hasExpenseDraft ? 'font-medium text-red-400' : 'text-muted'}>
                    {hasExpenseDraft ? '✓' : '○'} Expense added
                  </span>
                </div>
              )}

              {!budgetId && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/90">
                  Create a budget first to log transactions.{' '}
                  <button
                    type="button"
                    className="font-medium underline"
                    onClick={() => void handleBudgetNext(false)}
                    disabled={pendingBusy}
                  >
                    Create budget
                  </button>
                </div>
              )}

              {envelopeCategories.length === 0 && budgetId && (
                <p className="rounded-xl border border-border bg-surface-muted/30 px-4 py-3 text-sm text-muted">
                  No envelopes yet — you can still log transactions, or go back and add envelopes first.
                </p>
              )}

              {transactionForm && budgetId && (
                <TransactionFormCard
                  form={transactionForm}
                  categories={envelopeCategories}
                  onChange={setTransactionForm}
                  onTypeChange={(type) =>
                    setTransactionForm((prev) => (prev ? applyTransactionType(prev, type) : prev))
                  }
                  onAdd={() => {
                    if (addTransactionToList(transactionForm)) {
                      setTransactionForm(emptyTransactionDraft(envelopeCategories, 'expense'))
                    }
                  }}
                  disabled={pendingBusy}
                />
              )}

              {transactionDrafts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Ready to save</p>
                  {transactionDrafts.map((tx, i) => (
                    <div
                      key={`${tx.description}-${i}`}
                      className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{tx.description}</p>
                        <p
                          className={cn(
                            'text-xs',
                            tx.type === 'income' ? 'text-emerald-400' : 'text-red-400',
                          )}
                        >
                          {tx.type === 'income' ? 'Income' : 'Expense'}
                          {tx.categoryName ? ` · ${tx.categoryName}` : ''} · {tx.amount}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTransaction(i)}
                        className="rounded-lg p-1.5 text-muted hover:text-red-400"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {stepError && <p className="text-center text-sm text-red-400">{stepError}</p>}

              <div className="flex flex-col gap-3">
                <Button className="w-full" onClick={() => void handleFinish(false)} disabled={pendingBusy}>
                  {complete.isPending || isSaving ? 'Finishing…' : 'Finish & go to dashboard'}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-muted"
                  onClick={() => void handleFinish(true)}
                  disabled={pendingBusy}
                >
                  Skip & finish
                </Button>
                <Button variant="secondary" onClick={() => goTo('envelopes')} disabled={pendingBusy}>
                  Back
                </Button>
              </div>
            </div>
          )}
        </OnboardingStepPanel>
      </main>
    </div>
  )
}

interface TransactionFormCardProps {
  form: TransactionDraft
  categories: EnvelopeCategory[]
  onChange: (form: TransactionDraft) => void
  onTypeChange: (type: TransactionType) => void
  onAdd: () => void
  disabled?: boolean
}

function TransactionFormCard({
  form,
  categories,
  onChange,
  onTypeChange,
  onAdd,
  disabled,
}: TransactionFormCardProps) {
  const expenseCategories = categories.filter((c) => c.name.toLowerCase() !== 'salary')
  const envelopeCategories = form.type === 'expense' ? expenseCategories : categories
  const canAdd =
    Number(form.amount) > 0 &&
    form.description.trim() &&
    (form.type === 'income' || !!form.categoryId)

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface-muted/20 p-4">
      <TransactionTypeToggle
        value={form.type}
        onChange={onTypeChange}
        disabled={disabled}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-subtle">Amount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => onChange({ ...form, amount: e.target.value })}
            className={cn(
              inputClass,
              form.type === 'expense'
                ? 'border-red-500/30 focus:border-red-500/50 focus:ring-red-500/20'
                : 'border-emerald-500/30 focus:border-emerald-500/50 focus:ring-emerald-500/20',
            )}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-subtle">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => onChange({ ...form, date: e.target.value })}
            className={inputClass}
            disabled={disabled}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-subtle">Description</label>
        <input
          type="text"
          placeholder={form.type === 'income' ? 'Monthly salary' : 'Weekly groceries'}
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          className={inputClass}
          disabled={disabled}
        />
      </div>

      {form.type === 'expense' && envelopeCategories.length > 0 && (
        <div>
          <label className="mb-1 block text-xs font-medium text-subtle">Envelope</label>
          <select
            value={form.categoryId}
            onChange={(e) => {
              const cat = envelopeCategories.find((c) => c.id === e.target.value)
              onChange({
                ...form,
                categoryId: e.target.value,
                categoryName: cat?.name ?? '',
              })
            }}
            className={inputClass}
            disabled={disabled}
          >
            <option value="">Select envelope</option>
            {envelopeCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <Button size="sm" variant="secondary" onClick={onAdd} disabled={disabled || !canAdd}>
        Add {form.type === 'income' ? 'income' : 'expense'} to list
      </Button>
    </div>
  )
}
