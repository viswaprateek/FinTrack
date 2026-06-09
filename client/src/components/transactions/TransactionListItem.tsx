import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { cn, formatShortDate } from '../../lib/utils'
import { IconSplit, IconUsers } from '../ui/icons'
import type { ReimbursementStatus, Transaction } from '../../types'

const reimbursementTone: Record<ReimbursementStatus, 'neutral' | 'warning' | 'success'> = {
  none: 'neutral',
  pending: 'warning',
  received: 'success',
}

interface TransactionListItemProps {
  transaction: Transaction
  formatCurrency: (amount: number) => string
  budgetLabel?: string
  mismatched?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onFix?: () => void
  fixPending?: boolean
  className?: string
}

export function TransactionListItem({
  transaction: t,
  formatCurrency,
  budgetLabel,
  mismatched,
  onEdit,
  onDelete,
  onFix,
  fixPending,
  className,
}: TransactionListItemProps) {
  const isIncome = t.amount >= 0

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface-solid/50 p-4 transition-colors active:bg-hover/60',
        mismatched && 'border-amber-500/30 bg-amber-500/5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-foreground">{t.description}</p>
            {t.hasFriendSplit && (
              <span title="Split with friends">
                <IconUsers className="h-3.5 w-3.5 shrink-0 text-sky-400" />
              </span>
            )}
            {t.isSplit && !t.hasFriendSplit && (
              <span title="Split by category">
                <IconSplit className="h-3.5 w-3.5 shrink-0 text-sky-400" />
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted">
            {formatShortDate(t.date)}
            {budgetLabel && (
              <span className={cn('ml-2', mismatched ? 'text-amber-400' : '')}>
                · {budgetLabel}
              </span>
            )}
          </p>
        </div>
        <p
          className={cn(
            'shrink-0 text-base font-bold tabular-nums',
            isIncome ? 'text-success' : 'text-foreground',
          )}
        >
          {isIncome ? '+' : ''}
          {formatCurrency(t.amount)}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge>{t.category}</Badge>
        {t.hasFriendSplit && <Badge tone="info">Shared</Badge>}
        {t.reimbursable !== 'none' && !t.hasFriendSplit && (
          <Badge tone={reimbursementTone[t.reimbursable]}>
            {t.reimbursable === 'pending' ? 'Employer pending' : 'Employer received'}
          </Badge>
        )}
        {t.account && <span className="text-xs text-muted">{t.account}</span>}
      </div>

      {t.notes && <p className="mt-2 text-xs text-muted line-clamp-2">{t.notes}</p>}

      {(onEdit || onDelete || onFix) && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border/80 pt-3">
          {mismatched && onFix && (
            <Button variant="secondary" size="sm" onClick={onFix} disabled={fixPending}>
              Fix month
            </Button>
          )}
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={onDelete}>
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
