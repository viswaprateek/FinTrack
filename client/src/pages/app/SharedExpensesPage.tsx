import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { ContentLoader } from '../../components/ui/Spinner'
import { useApiClient, expenseSharesApi } from '../../api'
import { useCurrency } from '../../contexts/CurrencyContext'
import { formatCurrencyAmount } from '../../lib/currencies'
import { formatShortDate } from '../../lib/utils'
import type { ExpenseShare, OwedExpense } from '../../types'

type Tab = 'owed-to-you' | 'you-owe'

export function SharedExpensesPage() {
  const client = useApiClient()
  const queryClient = useQueryClient()
  const { formatCurrency } = useCurrency()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: Tab = searchParams.get('tab') === 'owed' ? 'you-owe' : 'owed-to-you'

  const setTab = (next: Tab) => {
    if (next === 'you-owe') {
      setSearchParams({ tab: 'owed' })
    } else {
      setSearchParams({})
    }
  }

  const sharesQuery = useQuery({
    queryKey: ['expense-shares'],
    queryFn: () => expenseSharesApi.list(client),
  })
  const owedToYouTotalQuery = useQuery({
    queryKey: ['expense-shares', 'outstanding'],
    queryFn: () => expenseSharesApi.outstandingTotal(client),
  })
  const owedQuery = useQuery({
    queryKey: ['expense-shares', 'owed'],
    queryFn: () => expenseSharesApi.listOwed(client),
  })
  const youOweTotalQuery = useQuery({
    queryKey: ['expense-shares', 'owed-total'],
    queryFn: () => expenseSharesApi.owedTotal(client),
  })

  const markPaid = useMutation({
    mutationFn: (participantId: string) =>
      expenseSharesApi.updateParticipant(client, participantId, { status: 'paid' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-shares'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })

  const shares = sharesQuery.data ?? []
  const owedToYou = owedToYouTotalQuery.data?.total ?? 0
  const owedItems = owedQuery.data ?? []
  const youOwe = youOweTotalQuery.data?.total ?? 0
  const pendingShares = shares.filter((s) =>
    s.participants.some((p) => p.status === 'pending'),
  )
  const pendingOwed = owedItems.filter((o) => o.status === 'pending')
  const hasConvertedOwed = owedItems.some((o) => o.currency !== o.displayCurrency)

  const isLoading =
    tab === 'owed-to-you'
      ? sharesQuery.isLoading
      : owedQuery.isLoading

  if (isLoading) {
    return <ContentLoader label="Loading shared expenses…" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-heading">Shared Expenses</h2>
        <p className="mt-1 text-sm text-muted">
          Track split expenses with friends — what they owe you and what you owe them.
        </p>
      </div>

      <div className="flex gap-2 rounded-xl border border-border-muted bg-input/30 p-1">
        <button
          type="button"
          onClick={() => setTab('owed-to-you')}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            tab === 'owed-to-you'
              ? 'bg-surface text-heading shadow-sm'
              : 'text-muted hover:text-foreground'
          }`}
        >
          Friends owe you
        </button>
        <button
          type="button"
          onClick={() => setTab('you-owe')}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            tab === 'you-owe'
              ? 'bg-surface text-heading shadow-sm'
              : 'text-muted hover:text-foreground'
          }`}
        >
          You owe friends
        </button>
      </div>

      {tab === 'owed-to-you' ? (
        <>
          <Card className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Friends owe you</p>
            <p className="mt-1 text-2xl font-bold text-heading">{formatCurrency(owedToYou)}</p>
            <p className="mt-1 text-sm text-muted">
              {pendingShares.length} expense{pendingShares.length === 1 ? '' : 's'} with outstanding balances
            </p>
          </Card>

          {shares.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted">
                No shared expenses yet. Split an expense with friends when adding a transaction.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {shares.map((share) => (
                <ShareCard
                  key={share.id}
                  share={share}
                  formatCurrency={formatCurrency}
                  onMarkPaid={(id) => markPaid.mutate(id)}
                  markPending={markPaid.isPending}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <Card className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">You owe friends</p>
            <p className="mt-1 text-2xl font-bold text-heading">{formatCurrency(youOwe)}</p>
            <p className="mt-1 text-sm text-muted">
              {pendingOwed.length} pending balance{pendingOwed.length === 1 ? '' : 's'} from friends on FinTrack
            </p>
            {hasConvertedOwed && (
              <p className="mt-2 text-xs text-muted">
                Totals converted to your currency using live exchange rates.
              </p>
            )}
          </Card>

          {owedItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted">
                Nothing owed right now. When a friend splits an expense with your email, it appears here.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {owedItems.map((item) => (
                <OwedCard
                  key={item.participantId}
                  item={item}
                  onMarkPaid={(id) => markPaid.mutate(id)}
                  markPending={markPaid.isPending}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ShareCard({
  share,
  formatCurrency,
  onMarkPaid,
  markPending,
}: {
  share: ExpenseShare
  formatCurrency: (n: number) => string
  onMarkPaid: (participantId: string) => void
  markPending: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{share.description}</CardTitle>
          <p className="mt-0.5 text-xs text-muted">
            {formatShortDate(share.transactionDate)} · Total {formatCurrency(share.totalAmount)} · Your share{' '}
            {formatCurrency(share.yourShare)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-0 pb-4">
        {share.participants.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-3"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{p.email}</p>
              <p className="text-sm text-muted">{formatCurrency(p.amountOwed)}</p>
              {p.friendDisplayAmount != null && p.friendDisplayCurrency && (
                <p className="text-xs text-muted">
                  ≈ {formatCurrencyAmount(p.friendDisplayAmount, p.friendDisplayCurrency)} for them
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={p.status === 'pending' ? 'warning' : 'success'}>
                {p.status === 'pending' ? 'Pending' : 'Paid'}
              </Badge>
              {p.status === 'pending' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onMarkPaid(p.id)}
                  disabled={markPending}
                >
                  Mark paid
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function OwedCard({
  item,
  onMarkPaid,
  markPending,
}: {
  item: OwedExpense
  onMarkPaid: (participantId: string) => void
  markPending: boolean
}) {
  const showOriginal = item.currency !== item.displayCurrency

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="text-sm font-medium text-foreground">{item.description}</p>
          <p className="mt-0.5 text-xs text-muted">
            {formatShortDate(item.transactionDate)} · Paid by {item.payerName}
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {formatCurrencyAmount(item.displayAmount, item.displayCurrency)}
          </p>
          {showOriginal && (
            <p className="mt-0.5 text-xs text-muted">
              Originally {formatCurrencyAmount(item.amountOwed, item.currency)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={item.status === 'pending' ? 'warning' : 'success'}>
            {item.status === 'pending' ? 'Pending' : 'Paid'}
          </Badge>
          {item.status === 'pending' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onMarkPaid(item.participantId)}
              disabled={markPending}
            >
              Mark paid
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
