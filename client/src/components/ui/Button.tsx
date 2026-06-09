import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

const variantStyles: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover font-medium',
  secondary: 'bg-surface-solid text-foreground hover:bg-hover border border-border',
  ghost: 'text-subtle hover:bg-hover hover:text-heading',
  danger: 'bg-danger-muted text-danger border border-danger/30 hover:bg-danger/20',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  )
}
