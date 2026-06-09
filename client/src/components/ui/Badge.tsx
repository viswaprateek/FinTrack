import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const toneStyles: Record<Tone, string> = {
  neutral: 'bg-surface-muted text-subtle border-border',
  success: 'bg-success-muted text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  danger: 'bg-danger-muted text-danger border-danger/30',
  info: 'bg-accent-muted text-accent border-accent/30',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  )
}
