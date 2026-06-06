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
        'inline-block animate-spin rounded-full border-slate-700 border-t-emerald-400',
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
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-sm text-slate-400', className)}>
      <Spinner />
      <span>{label}</span>
    </div>
  )
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-950">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-2xl bg-emerald-500/20" />
        <span className="absolute inset-0 animate-spin rounded-2xl border-2 border-transparent border-t-emerald-400" />
        <Logo className="h-12 w-12 rounded-2xl" iconClassName="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-slate-400">{label}</p>
    </div>
  )
}
