export interface BadgeDefinition {
  id: string
  name: string
  emoji: string
  description: string
  color: string
}

export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    id: 'first-log',
    name: 'First Log',
    emoji: '📝',
    description: 'Logged your first expense',
    color: 'bg-emerald-500/15 text-emerald-400',
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    emoji: '🔥',
    description: 'Tracked expenses 7 days in a row',
    color: 'bg-orange-500/15 text-orange-400',
  },
  {
    id: 'envelope-starter',
    name: 'Envelope Starter',
    emoji: '✉️',
    description: 'Set up your first spending envelopes',
    color: 'bg-blue-500/15 text-blue-400',
  },
  {
    id: 'goal-setter',
    name: 'Goal Setter',
    emoji: '🎯',
    description: 'Created a savings goal',
    color: 'bg-violet-500/15 text-violet-400',
  },
  {
    id: 'budget-builder',
    name: 'Budget Builder',
    emoji: '📊',
    description: 'Created your first monthly budget',
    color: 'bg-cyan-500/15 text-cyan-400',
  },
  {
    id: 'card-explorer',
    name: 'Card Explorer',
    emoji: '💳',
    description: 'Added a mock credit card',
    color: 'bg-pink-500/15 text-pink-400',
  },
  {
    id: 'consistent',
    name: 'Consistent',
    emoji: '⭐',
    description: '30 active expense days in a year',
    color: 'bg-amber-500/15 text-amber-400',
  },
  {
    id: 'planner',
    name: 'Planner',
    emoji: '🗓️',
    description: 'Set up a recurring bill',
    color: 'bg-indigo-500/15 text-indigo-400',
  },
]

export function pickRandomBadges(count: number): BadgeDefinition[] {
  const shuffled = [...BADGE_CATALOG].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
