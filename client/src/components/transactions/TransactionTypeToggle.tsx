import { cn } from '../../lib/utils'

export type TransactionType = 'expense' | 'income'

interface TransactionTypeToggleProps {
  value: TransactionType
  onChange: (value: TransactionType) => void
  disabled?: boolean
  className?: string
}

export function TransactionTypeToggle({
  value,
  onChange,
  disabled,
  className,
}: TransactionTypeToggleProps) {
  return (
    <div
      role="group"
      aria-label="Transaction type"
      className={cn(
        'flex rounded-xl border border-border-muted bg-input/50 p-1',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <button
        type="button"
        aria-pressed={value === 'expense'}
        onClick={() => onChange('expense')}
        className={cn(
          'flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
          value === 'expense'
            ? 'bg-red-500/20 text-red-400 shadow-sm'
            : 'text-muted hover:text-foreground',
        )}
      >
        Expense
      </button>
      <button
        type="button"
        aria-pressed={value === 'income'}
        onClick={() => onChange('income')}
        className={cn(
          'flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
          value === 'income'
            ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
            : 'text-muted hover:text-foreground',
        )}
      >
        Income
      </button>
    </div>
  )
}
