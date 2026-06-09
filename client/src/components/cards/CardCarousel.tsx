import { useEffect, useRef } from 'react'
import { cn } from '../../lib/utils'
import { BRAND_LABELS } from '../../lib/cardThemes'
import { CreditCardVisual } from './CreditCardVisual'
import type { CreditCard } from '../../types'

interface CardCarouselProps {
  cards: CreditCard[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAddClick: () => void
}

export function CardSwitcher({ cards, selectedId, onSelect, onAddClick }: CardCarouselProps) {
  const activeCards = cards.filter((c) => c.isActive)

  return (
    <div className="flex items-center gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {activeCards.map((card) => {
        const selected = card.id === selectedId
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelect(card.id)}
            className={cn(
              'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              selected
                ? 'border-accent/50 bg-accent-muted text-accent'
                : 'border-border bg-surface-solid text-muted-fg hover:border-border-muted hover:text-foreground',
            )}
          >
            {card.label}
            <span className="ml-1.5 text-xs opacity-70">••{card.lastFour}</span>
          </button>
        )
      })}
      {cards.filter((c) => !c.isActive).map((card) => {
        const selected = card.id === selectedId
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelect(card.id)}
            className={cn(
              'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              selected
                ? 'border-slate-500/50 bg-slate-500/15 text-slate-300'
                : 'border-border bg-surface-solid text-muted opacity-60 hover:opacity-100',
            )}
          >
            🔒 {card.label}
          </button>
        )
      })}
      <button
        type="button"
        onClick={onAddClick}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-border-muted text-muted transition-colors hover:border-accent/40 hover:text-accent"
        aria-label="Add card"
      >
        +
      </button>
    </div>
  )
}

export function CardCarousel({ cards, selectedId, onSelect, onAddClick }: CardCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const displayCards = cards.length > 0 ? cards : []

  useEffect(() => {
    if (!selectedId) return
    const el = cardRefs.current.get(selectedId)
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [selectedId])

  if (displayCards.length === 0) {
    return (
      <button
        type="button"
        onClick={onAddClick}
        className="flex w-full max-w-sm flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border-muted bg-surface-muted/50 px-8 py-16 text-muted transition-colors hover:border-accent/40 hover:text-accent"
      >
        <span className="text-3xl">+</span>
        <span className="mt-2 text-sm font-medium">Add a card</span>
      </button>
    )
  }

  return (
    <div ref={scrollRef} className="flex w-max min-w-full snap-x snap-mandatory gap-4 py-1">
      {displayCards.map((card) => {
        const selected = card.id === selectedId
        return (
          <button
            key={card.id}
            ref={(node) => {
              if (node) cardRefs.current.set(card.id, node)
              else cardRefs.current.delete(card.id)
            }}
            type="button"
            onClick={() => onSelect(card.id)}
            className={cn(
              'w-[260px] shrink-0 snap-center text-left transition-all sm:w-[280px]',
              selected ? 'opacity-100' : 'opacity-80 hover:opacity-95',
            )}
          >
            <CreditCardVisual
              card={card}
              className={cn(
                'shadow-lg transition-shadow',
                selected && 'shadow-accent/20 ring-2 ring-accent/50 ring-inset',
                !card.isActive && 'grayscale',
              )}
            />
            <p className="mt-2 text-center text-xs text-muted">
              {card.label} · {BRAND_LABELS[card.brand]}
            </p>
          </button>
        )
      })}

      <button
        type="button"
        onClick={onAddClick}
        className="flex aspect-[1.62/1] w-[260px] shrink-0 snap-center flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border-muted bg-surface-muted/30 text-muted transition-colors hover:border-accent/40 hover:text-accent sm:w-[280px]"
      >
        <span className="text-3xl">+</span>
        <span className="mt-2 text-sm font-medium">Add new card</span>
      </button>
    </div>
  )
}
