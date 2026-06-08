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
        compact ? 'aspect-[1.6/1] p-5' : 'aspect-[1.7/1] p-6 sm:p-7',
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-black/10 blur-2xl" />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className={cn('h-8 w-11 rounded-md', theme.chip)} />
          <span className="text-sm font-bold tracking-widest">{BRAND_LABELS[card.brand]}</span>
        </div>

        <div>
          <p className={cn('font-mono text-lg tracking-[0.2em] sm:text-xl', compact && 'text-base')}>
            •••• •••• •••• {card.lastFour}
          </p>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className={cn('text-[10px] uppercase tracking-wider', theme.accent)}>Card holder</p>
              <p className="truncate text-sm font-semibold uppercase sm:text-base">{card.cardholderName}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className={cn('text-[10px] uppercase tracking-wider', theme.accent)}>Expires</p>
              <p className="text-sm font-semibold">{expiry}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
