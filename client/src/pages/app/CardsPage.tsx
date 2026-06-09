import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { ContentLoader } from '../../components/ui/Spinner'
import { CardCarousel, CardSwitcher } from '../../components/cards/CardCarousel'
import { useApiClient, cardsApi } from '../../api'
import { usePrivateCurrency } from '../../hooks/usePrivateCurrency'
import { BRAND_OPTIONS, BRAND_LABELS, THEME_OPTIONS } from '../../lib/cardThemes'
import { formatShortDate } from '../../lib/utils'
import {
  IconArrowLeftRight,
  IconCreditCard,
  IconLock,
  IconPlus,
  IconReceipt,
  IconSparkles,
  IconWallet,
} from '../../components/ui/icons'
import type { CardBrand, CardTheme, CardTransaction, CreditCard } from '../../types'

const inputClass =
  'w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-emerald-400 focus:outline-none'

const CATEGORY_ICONS: Record<string, string> = {
  Transfer: '↗',
  Health: '🏋',
  Shopping: '🛍',
  Subscriptions: '📱',
  Travel: '✈',
  Dining: '🍽',
  default: '💳',
}

export function CardsPage() {
  const client = useApiClient()
  const queryClient = useQueryClient()
  const { displayAmount, displayPercent } = usePrivateCurrency()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [chargeOpen, setChargeOpen] = useState(false)
  const [mockNotice, setMockNotice] = useState<string | null>(null)

  const [formLabel, setFormLabel] = useState('')
  const [formName, setFormName] = useState('')
  const [formLastFour, setFormLastFour] = useState('')
  const [formBrand, setFormBrand] = useState<CardBrand>('visa')
  const [formTheme, setFormTheme] = useState<CardTheme>('lime')
  const [formLimit, setFormLimit] = useState('')
  const [formBalance, setFormBalance] = useState('')
  const [formExpiryMonth, setFormExpiryMonth] = useState('12')
  const [formExpiryYear, setFormExpiryYear] = useState(String(new Date().getFullYear() + 3))

  const [chargeDesc, setChargeDesc] = useState('')
  const [chargeAmount, setChargeAmount] = useState('')
  const [chargeCategory, setChargeCategory] = useState('')

  const cardsQuery = useQuery({ queryKey: ['cards'], queryFn: () => cardsApi.list(client) })
  const txnsQuery = useQuery({ queryKey: ['cards', 'transactions'], queryFn: () => cardsApi.listTransactions(client, 15) })

  const cards = cardsQuery.data ?? []
  const transactions = txnsQuery.data ?? []

  const selectedCard = useMemo(
    () => cards.find((c) => c.id === selectedId) ?? cards.find((c) => c.isActive) ?? cards[0] ?? null,
    [cards, selectedId],
  )

  useEffect(() => {
    if (cards.length > 0 && !selectedId) {
      setSelectedId(cards.find((c) => c.isActive)?.id ?? cards[0].id)
    }
  }, [cards, selectedId])

  const totals = useMemo(() => {
    const active = cards.filter((c) => c.isActive)
    return {
      limit: active.reduce((s, c) => s + Number(c.creditLimit), 0),
      balance: active.reduce((s, c) => s + Number(c.currentBalance), 0),
      available: active.reduce((s, c) => s + Number(c.availableCredit), 0),
    }
  }, [cards])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['cards'] })
  }

  const seedDemo = useMutation({
    mutationFn: () => cardsApi.seedDemo(client),
    onSuccess: (data) => {
      invalidate()
      setSelectedId(data[0]?.id ?? null)
    },
  })

  const createCard = useMutation({
    mutationFn: () =>
      cardsApi.create(client, {
        label: formLabel.trim(),
        cardholder_name: formName.trim(),
        last_four: formLastFour,
        brand: formBrand,
        theme: formTheme,
        credit_limit: Number(formLimit),
        current_balance: formBalance ? Number(formBalance) : 0,
        expiry_month: Number(formExpiryMonth),
        expiry_year: Number(formExpiryYear),
      }),
    onSuccess: (card) => {
      invalidate()
      setSelectedId(card.id)
      setAddOpen(false)
      resetForm()
    },
  })

  const payBalance = useMutation({
    mutationFn: (cardId: string) => cardsApi.payBalance(client, cardId),
    onSuccess: () => {
      invalidate()
      showMock('Payment recorded (demo — no real charge)')
    },
  })

  const addCharge = useMutation({
    mutationFn: () =>
      cardsApi.addTransaction(client, selectedCard!.id, {
        description: chargeDesc.trim(),
        amount: Number(chargeAmount),
        category: chargeCategory || null,
      }),
    onSuccess: () => {
      invalidate()
      setChargeOpen(false)
      setChargeDesc('')
      setChargeAmount('')
      setChargeCategory('')
    },
  })

  const toggleLock = useMutation({
    mutationFn: (card: CreditCard) =>
      cardsApi.update(client, card.id, { is_active: !card.isActive }),
    onSuccess: () => {
      invalidate()
      showMock(selectedCard?.isActive ? 'Card locked (demo)' : 'Card unlocked (demo)')
    },
  })

  function resetForm() {
    setFormLabel('')
    setFormName('')
    setFormLastFour('')
    setFormBrand('visa')
    setFormTheme('lime')
    setFormLimit('')
    setFormBalance('')
    setFormExpiryMonth('12')
    setFormExpiryYear(String(new Date().getFullYear() + 3))
  }

  function showMock(msg: string) {
    setMockNotice(msg)
    setTimeout(() => setMockNotice(null), 3000)
  }

  function openAdd() {
    resetForm()
    setAddOpen(true)
  }

  const canCreate =
    !!formLabel.trim() && !!formName.trim() && formLastFour.length === 4 && !!formLimit && Number(formLimit) > 0

  if (cardsQuery.isLoading) {
    return <ContentLoader label="Loading cards…" />
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Demo banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <IconSparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-200">Demo mode</p>
            <p className="text-xs text-amber-200/70">Cards are mock — not connected to real banks or payment networks.</p>
          </div>
        </div>
        {cards.length === 0 && (
          <Button size="sm" onClick={() => seedDemo.mutate()} disabled={seedDemo.isPending}>
            {seedDemo.isPending ? 'Loading…' : 'Load demo cards'}
          </Button>
        )}
      </div>

      {mockNotice && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
          {mockNotice}
        </div>
      )}

      {/* Card switcher — quick access at top */}
      {cards.length > 0 && (
        <div className="-mx-1 min-w-0 overflow-hidden px-1">
          <CardSwitcher
            cards={cards}
            selectedId={selectedCard?.id ?? null}
            onSelect={setSelectedId}
            onAddClick={openAdd}
          />
        </div>
      )}

      {/* Horizontal card carousel */}
      <div className="-mx-4 min-w-0 overflow-hidden sm:-mx-6 lg:-mx-8">
        <div className="overflow-x-auto overscroll-x-contain px-4 pb-1 sm:px-6 lg:px-8">
          <CardCarousel
            cards={cards}
            selectedId={selectedCard?.id ?? null}
            onSelect={setSelectedId}
            onAddClick={openAdd}
          />
        </div>
      </div>

      {selectedCard && (
        <Card className="overflow-hidden border-border/80">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-heading">{selectedCard.label}</p>
                <p className="text-xs text-muted">{BRAND_LABELS[selectedCard.brand]} ·••• {selectedCard.lastFour}</p>
              </div>
              {!selectedCard.isActive && <Badge tone="neutral">Locked</Badge>}
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Used</span>
                <span className="font-medium text-foreground">
                  {displayAmount(selectedCard.currentBalance)} / {displayAmount(selectedCard.creditLimit)}
                </span>
              </div>
              <ProgressBar
                value={selectedCard.currentBalance}
                max={selectedCard.creditLimit}
                className="mt-2"
              />
              <p className="mt-1.5 text-xs text-muted">
                {displayPercent(selectedCard.utilizationPercent)} utilized · {displayAmount(selectedCard.availableCredit)} available
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Total limit" value={displayAmount(totals.limit)} />
        <StatTile label="Balance owed" value={displayAmount(totals.balance)} accent="text-amber-400" />
        <StatTile label="Available" value={displayAmount(totals.available)} accent="text-emerald-400" />
      </div>

      {selectedCard && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickAction icon={IconReceipt} label="Add charge" onClick={() => setChargeOpen(true)} />
          <QuickAction
            icon={IconWallet}
            label="Pay balance"
            onClick={() => payBalance.mutate(selectedCard.id)}
            disabled={payBalance.isPending || selectedCard.currentBalance === 0}
          />
          <QuickAction
            icon={IconLock}
            label={selectedCard.isActive ? 'Lock card' : 'Unlock'}
            onClick={() => toggleLock.mutate(selectedCard)}
            disabled={toggleLock.isPending}
          />
          <QuickAction
            icon={IconArrowLeftRight}
            label="Transfer"
            onClick={() => showMock('Transfers are not available in demo mode')}
          />
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent activity</CardTitle>
          <Button variant="ghost" size="sm" onClick={openAdd}>
            <IconPlus className="h-4 w-4" />
            Add card
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {transactions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No transactions yet. Add a mock charge to get started.</p>
          ) : (
            transactions.map((txn) => (
              <TxnRow key={txn.id} txn={txn} displayAmount={displayAmount} />
            ))
          )}
        </CardContent>
      </Card>

      {addOpen && (
        <Modal title="Add new card" onClose={() => setAddOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-subtle">Card nickname</label>
              <input value={formLabel} onChange={(e) => setFormLabel(e.target.value)} placeholder="Everyday Visa" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-subtle">Cardholder name</label>
              <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Your name" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-subtle">Last 4 digits</label>
                <input
                  value={formLastFour}
                  onChange={(e) => setFormLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="9743"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-subtle">Brand</label>
                <select value={formBrand} onChange={(e) => setFormBrand(e.target.value as CardBrand)} className={inputClass}>
                  {BRAND_OPTIONS.map((b) => (
                    <option key={b} value={b}>{BRAND_LABELS[b]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-subtle">Credit limit</label>
                <input value={formLimit} onChange={(e) => setFormLimit(e.target.value)} type="number" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-subtle">Current balance</label>
                <input value={formBalance} onChange={(e) => setFormBalance(e.target.value)} type="number" placeholder="0" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-subtle">Theme</label>
                <select value={formTheme} onChange={(e) => setFormTheme(e.target.value as CardTheme)} className={inputClass}>
                  {THEME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-subtle">Exp. month</label>
                <input value={formExpiryMonth} onChange={(e) => setFormExpiryMonth(e.target.value)} type="number" min={1} max={12} className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-subtle">Exp. year</label>
                <input value={formExpiryYear} onChange={(e) => setFormExpiryYear(e.target.value)} type="number" className={inputClass} />
              </div>
            </div>
          </div>
          {createCard.isError && <p className="mt-3 text-sm text-red-400">Failed to add card.</p>}
          <ModalActions
            onCancel={() => setAddOpen(false)}
            onSubmit={() => createCard.mutate()}
            submitLabel={createCard.isPending ? 'Saving…' : 'Save card'}
            disabled={createCard.isPending || !canCreate}
          />
        </Modal>
      )}

      {chargeOpen && selectedCard && (
        <Modal title={`Add charge — ${selectedCard.label}`} onClose={() => setChargeOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-subtle">Description</label>
              <input value={chargeDesc} onChange={(e) => setChargeDesc(e.target.value)} placeholder="Coffee shop" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-subtle">Amount</label>
                <input value={chargeAmount} onChange={(e) => setChargeAmount(e.target.value)} type="number" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-subtle">Category</label>
                <input value={chargeCategory} onChange={(e) => setChargeCategory(e.target.value)} placeholder="Dining" className={inputClass} />
              </div>
            </div>
          </div>
          {addCharge.isError && <p className="mt-3 text-sm text-red-400">Failed to add charge.</p>}
          <ModalActions
            onCancel={() => setChargeOpen(false)}
            onSubmit={() => addCharge.mutate()}
            submitLabel={addCharge.isPending ? 'Saving…' : 'Add charge'}
            disabled={addCharge.isPending || !chargeDesc.trim() || !chargeAmount}
          />
        </Modal>
      )}
    </div>
  )
}

function StatTile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-solid px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-1 text-lg font-bold text-heading ${accent ?? ''}`}>{value}</p>
    </div>
  )
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof IconCreditCard
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface-solid px-3 py-4 text-center transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5 disabled:opacity-50"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-input text-emerald-400">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-medium text-muted-fg">{label}</span>
    </button>
  )
}

function TxnRow({
  txn,
  displayAmount,
}: {
  txn: CardTransaction
  displayAmount: (n: number) => string
}) {
  const icon = CATEGORY_ICONS[txn.category ?? ''] ?? CATEGORY_ICONS.default
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-input/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-input text-base">{icon}</div>
        <div>
          <p className="text-sm font-medium text-foreground">{txn.description}</p>
          <p className="text-xs text-muted">
            {txn.cardLabel} · {formatShortDate(txn.transactedAt)}
            {txn.category ? ` · ${txn.category}` : ''}
          </p>
        </div>
      </div>
      <span className="text-sm font-semibold text-red-400">-{displayAmount(txn.amount)}</span>
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <Card className="max-h-[90vh] w-full max-w-md overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
