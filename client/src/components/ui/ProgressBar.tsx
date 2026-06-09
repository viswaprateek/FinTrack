import { cn } from '../../lib/utils'

interface ProgressBarProps {
  value: number
  max: number
  className?: string
}

export function ProgressBar({ value, max, className }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const overBudget = value > max

  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-muted', className)}>
      <div
        className={cn('h-full rounded-full transition-all', overBudget ? 'bg-danger' : 'bg-accent')}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
