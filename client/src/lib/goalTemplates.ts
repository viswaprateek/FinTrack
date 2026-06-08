export interface GoalTemplate {
  name: string
  icon: string
  emoji: string
  color: string
  suggestedTarget: number
}

/** Curated starter goals — icons are stored on the user's Goal record. */
export const GOAL_TEMPLATES: GoalTemplate[] = [
  { name: 'Emergency Fund', icon: 'emergency', emoji: '🛡️', color: 'bg-blue-500/15 text-blue-400', suggestedTarget: 10000 },
  { name: 'Vacation', icon: 'vacation', emoji: '✈️', color: 'bg-cyan-500/15 text-cyan-400', suggestedTarget: 3000 },
  { name: 'New Car', icon: 'car', emoji: '🚗', color: 'bg-slate-500/15 text-slate-300', suggestedTarget: 15000 },
  { name: 'Home Down Payment', icon: 'home', emoji: '🏠', color: 'bg-amber-500/15 text-amber-400', suggestedTarget: 50000 },
  { name: 'Wedding', icon: 'wedding', emoji: '💍', color: 'bg-rose-500/15 text-rose-400', suggestedTarget: 20000 },
  { name: 'Education', icon: 'education', emoji: '📚', color: 'bg-violet-500/15 text-violet-400', suggestedTarget: 5000 },
  { name: 'New Laptop', icon: 'gadget', emoji: '💻', color: 'bg-indigo-500/15 text-indigo-400', suggestedTarget: 2000 },
  { name: 'Holiday Gifts', icon: 'gifts', emoji: '🎁', color: 'bg-pink-500/15 text-pink-400', suggestedTarget: 500 },
]

const templateByIcon = new Map(GOAL_TEMPLATES.map((t) => [t.icon, t]))
const templateByName = new Map(GOAL_TEMPLATES.map((t) => [t.name.toLowerCase(), t]))

export function getGoalTemplate(icon?: string | null, name?: string): GoalTemplate | null {
  if (icon && templateByIcon.has(icon)) return templateByIcon.get(icon)!
  if (name && templateByName.has(name.toLowerCase())) return templateByName.get(name.toLowerCase())!
  return null
}
