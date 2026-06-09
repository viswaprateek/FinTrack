import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { ContentLoader } from '../../components/ui/Spinner'
import { useApiClient, expenseSharesApi } from '../../api'
import { useCurrency } from '../../contexts/CurrencyContext'
import { formatShortDate } from '../../lib/utils'
import type { ExpenseShare, ReminderFrequency } from '../../types'

export function SharedExpensesPage() {
  const client = useApiClient()
  const queryClient = useQueryClient()
  const { formatCurrency } = useCurrency()

  const sharesQuery = useQuery({
    queryKey: ['expense-shares'],
    queryFn: () => expenseSharesApi.list(client),
  })
  const totalQuery = useQuery({
    queryKey: ['expense-shares', 'outstanding'],
    queryFn: () => expenseSharesApi.outstandingTotal(client),
  })

  const markPaid = useMutation({
    mutationFn: (participantId: string) =>
      expenseSharesApi.updateParticipant(client, participantId, { status: 'paid' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-shares'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })

  const updateReminder = useMutation({
    mutationFn: ({ shareId, frequency }: { shareId: string; frequency: ReminderFrequency }) =>
      expenseSharesApi.update(client, shareId, { reminder_frequency: frequency }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expense-shares'] }),
  })

  const shares = sharesQuery.data ?? []
  const outstanding = totalQuery.data?.total ?? 0
  const pendingShares = shares.filter((s) =>
    s.participants.some((p) => p.status === 'pending'),
  )

  if (sharesQuery.isLoading) {
    return <ContentLoader label="Loading shared expenses…" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-heading">Shared Expenses</h2>
        <p className="mt-1 text-sm text-muted">
          Track what friends owe you from split expenses.
        </p>
      </div>

      <Card className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Friends owe you</p>
        <p className="mt-1 text-2xl font-bold text-heading">{formatCurrency(outstanding)}</p>
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
              onReminderChange={(frequency) =>
                updateReminder.mutate({ shareId: share.id, frequency })
              }
              markPending={markPaid.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ShareCard({
  share,
  formatCurrency,
  onMarkPaid,
  onReminderChange,
  markPending,
}: {
  share: ExpenseShare
  formatCurrency: (n: number) => string
  onMarkPaid: (participantId: string) => void
  onReminderChange: (frequency: ReminderFrequency) => void
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
        <select
          value={share.reminderFrequency}
          onChange={(e) => onReminderChange(e.target.value as ReminderFrequency)}
          className="rounded-lg border border-border-muted bg-input px-2 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted"
          aria-label="Reminder frequency"
        >
          <option value="off">Reminders off</option>
          <option value="weekly">Weekly reminders</option>
          <option value="monthly">Monthly reminders</option>
        </select>
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
