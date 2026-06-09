import { cn } from '../../lib/utils'
import { BRAND_LABELS, CARD_THEMES } from '../../lib/cardThemes'
import type { CreditCard } from '../../types'

interface CreditCardVisualProps {
  card: Pick<CreditCard, 'cardholderName' | 'lastFour' | 'brand' | 'theme' | 'label'>
  className?: string
  compact?: boolean
}

export function CreditCardVisual({ card, className, compact }: CreditCardVisualProps) {
  const theme = CARD_THEMES[card.theme]
  const expiry = '••/••'

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl bg-gradient-to-br shadow-xl',
        theme.gradient,
        theme.text,
        compact ? 'aspect-[1.62/1] px-4 py-4' : 'aspect-[1.62/1] px-5 py-5 sm:px-6 sm:py-6',
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-black/10 blur-2xl" />

      <div className="relative flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 items-start justify-between gap-3">
          <div className={cn('h-7 w-10 rounded-md sm:h-8 sm:w-11', theme.chip)} />
          <span className="text-xs font-bold tracking-widest sm:text-sm">{BRAND_LABELS[card.brand]}</span>
        </div>

        <div className="flex min-h-0 flex-1 items-center py-2 sm:py-3">
          <p
            className={cn(
              'w-full font-mono leading-none tracking-[0.15em] sm:tracking-[0.2em]',
              compact ? 'text-sm' : 'text-base sm:text-lg',
            )}
          >
            •••• •••• •••• {card.lastFour}
          </p>
        </div>

        <div className="mt-auto flex shrink-0 items-end justify-between gap-3 pt-1">
          <div className="min-w-0 flex-1">
            <p className={cn('text-[9px] font-medium uppercase tracking-wider sm:text-[10px]', theme.accent)}>
              Card holder
            </p>
            <p className="truncate text-xs font-semibold uppercase leading-tight sm:text-sm">{card.cardholderName}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className={cn('text-[9px] font-medium uppercase tracking-wider sm:text-[10px]', theme.accent)}>
              Expires
            </p>
            <p className="text-xs font-semibold leading-tight sm:text-sm">{expiry}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
