import { cn } from '../../lib/utils'
import { IconLogo } from './icons'

type LogoProps = {
  className?: string
  iconClassName?: string
}

export function Logo({ className, iconClassName }: LogoProps) {
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-slate-950',
        className,
      )}
    >
      <IconLogo className={cn('h-5 w-5', iconClassName)} />
    </div>
  )
}
