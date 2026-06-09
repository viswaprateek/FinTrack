export type BadgeIconKey =
  | 'first-log'
  | 'week-warrior'
  | 'envelope-starter'
  | 'goal-setter'
  | 'budget-builder'
  | 'card-explorer'
  | 'consistent'
  | 'planner'

export interface BadgeDefinition {
  id: BadgeIconKey
  name: string
  description: string
}

export const BADGE_CATALOG: BadgeDefinition[] = [
  { id: 'first-log', name: 'First Log', description: 'Logged your first expense' },
  { id: 'week-warrior', name: 'Week Warrior', description: 'Tracked expenses 7 days in a row' },
  { id: 'envelope-starter', name: 'Envelope Starter', description: 'Set up your first spending envelopes' },
  { id: 'goal-setter', name: 'Goal Setter', description: 'Created a savings goal' },
  { id: 'budget-builder', name: 'Budget Builder', description: 'Created your first monthly budget' },
  { id: 'card-explorer', name: 'Card Explorer', description: 'Added a mock credit card' },
  { id: 'consistent', name: 'Consistent', description: '30 active expense days in a year' },
  { id: 'planner', name: 'Planner', description: 'Set up a recurring bill' },
]

export function pickRandomBadges(count: number): BadgeDefinition[] {
  const shuffled = [...BADGE_CATALOG].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
