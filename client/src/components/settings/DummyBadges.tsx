import { useMemo } from 'react'
import { pickRandomBadges } from '../../lib/badgeDefinitions'
import { IconArrowRight } from '../ui/icons'
import { BadgeHex, BadgeShield } from './BadgeVisual'

const HEX_RIBBONS = ['7 DAYS', '30 DAYS', '50 DAYS', 'DAYS', '100 DAYS']

export function DummyBadges() {
  const { totalCount, mostRecent, ribbons } = useMemo(() => {
    const picked = pickRandomBadges(3)
    const shuffledRibbons = [...HEX_RIBBONS].sort(() => Math.random() - 0.5)
    return {
      totalCount: picked.length + 1 + Math.floor(Math.random() * 3),
      mostRecent: picked[0],
      ribbons: [shuffledRibbons[0], shuffledRibbons[1]],
    }
  }, [])

  return (
    <div className="flex h-full min-h-[220px] flex-col rounded-2xl border border-border bg-surface-muted/20 px-4 py-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">Badges</span>
        <button
          type="button"
          className="text-muted transition-colors hover:text-subtle"
          aria-label="View all badges"
          disabled
        >
          <IconArrowRight className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-1 text-3xl font-bold tracking-tight text-heading">{totalCount}</p>

      <div className="flex flex-1 items-end justify-center gap-0.5 py-2">
        <BadgeHex ribbon={ribbons[0]} tier="gold" className="-mr-1 scale-[0.88] opacity-95" />
        <BadgeShield iconKey={mostRecent.id} className="z-10 -mt-1" />
        <BadgeHex ribbon={ribbons[1]} tier="gold" className="-ml-1 scale-[0.88]" />
      </div>

      <div className="mt-auto border-t border-border/60 pt-3">
        <p className="text-[11px] text-muted">Most Recent Badge</p>
        <p className="mt-0.5 text-base font-semibold text-heading">{mostRecent.name}</p>
      </div>
    </div>
  )
}
