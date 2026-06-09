import { cn } from '../../lib/utils'
import { Logo } from './Logo'

type SpinnerProps = {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-7 w-7 border-2',
  lg: 'h-11 w-11 border-[3px]',
}

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  return (
    <span
      className={cn(
        'inline-block animate-spin rounded-full border-border-muted border-t-accent',
        sizeClasses[size],
        className,
      )}
    />
  )
}

type LoadingStateProps = {
  label?: string
  className?: string
}

export function LoadingState({ label = 'Loading…', className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-sm text-muted-fg', className)}>
      <Spinner />
      <span>{label}</span>
    </div>
  )
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <Logo className="h-14 w-14 rounded-2xl" iconClassName="h-7 w-7" />
      <p className="text-sm font-medium text-subtle">{label}</p>
    </div>
  )
}

/** Centered loader for page content areas (sidebar + topbar remain visible). */
export function ContentLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-sm font-medium text-muted-fg">{label}</p>
    </div>
  )
}

/** Placeholder while chart data is still fetching. */
export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="animate-pulse space-y-3" style={{ height }}>
      <div className="flex h-full items-end gap-2 rounded-xl bg-surface-muted/30 px-4 pb-4 pt-8">
        <div className="h-[35%] flex-1 rounded-md bg-input" />
        <div className="h-[55%] flex-1 rounded-md bg-input" />
        <div className="h-[40%] flex-1 rounded-md bg-input" />
        <div className="h-[70%] flex-1 rounded-md bg-input" />
        <div className="h-[45%] flex-1 rounded-md bg-input" />
        <div className="h-[60%] flex-1 rounded-md bg-input" />
      </div>
    </div>
  )
}
