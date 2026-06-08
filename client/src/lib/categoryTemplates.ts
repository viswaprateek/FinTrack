export interface CategoryTemplate {
  name: string
  icon: string
  emoji: string
  color: string
}

/** Curated starter categories — icons are stored on the user's Category record. */
export const CATEGORY_TEMPLATES: CategoryTemplate[] = [
  { name: 'Groceries', icon: 'groceries', emoji: '🛒', color: 'bg-emerald-500/15 text-emerald-400' },
  { name: 'Rent', icon: 'rent', emoji: '🏠', color: 'bg-blue-500/15 text-blue-400' },
  { name: 'Utilities', icon: 'utilities', emoji: '💡', color: 'bg-amber-500/15 text-amber-400' },
  { name: 'Transport', icon: 'transport', emoji: '🚗', color: 'bg-cyan-500/15 text-cyan-400' },
  { name: 'Dining Out', icon: 'dining', emoji: '🍽️', color: 'bg-orange-500/15 text-orange-400' },
  { name: 'Entertainment', icon: 'entertainment', emoji: '🎬', color: 'bg-purple-500/15 text-purple-400' },
  { name: 'Shopping', icon: 'shopping', emoji: '🛍️', color: 'bg-pink-500/15 text-pink-400' },
  { name: 'Health', icon: 'health', emoji: '💊', color: 'bg-red-500/15 text-red-400' },
  { name: 'Travel', icon: 'travel', emoji: '✈️', color: 'bg-indigo-500/15 text-indigo-400' },
  { name: 'Education', icon: 'education', emoji: '📚', color: 'bg-violet-500/15 text-violet-400' },
  { name: 'Subscriptions', icon: 'subscriptions', emoji: '📱', color: 'bg-slate-500/15 text-slate-300' },
  { name: 'Salary', icon: 'salary', emoji: '💰', color: 'bg-emerald-500/15 text-emerald-300' },
  { name: 'Savings', icon: 'savings', emoji: '🏦', color: 'bg-teal-500/15 text-teal-400' },
  { name: 'Gifts', icon: 'gifts', emoji: '🎁', color: 'bg-rose-500/15 text-rose-400' },
  { name: 'Personal Care', icon: 'personal', emoji: '💇', color: 'bg-fuchsia-500/15 text-fuchsia-400' },
  { name: 'Pets', icon: 'pets', emoji: '🐾', color: 'bg-lime-500/15 text-lime-400' },
]

const templateByIcon = new Map(CATEGORY_TEMPLATES.map((t) => [t.icon, t]))
const templateByName = new Map(CATEGORY_TEMPLATES.map((t) => [t.name.toLowerCase(), t]))

export function getCategoryTemplate(icon?: string | null, name?: string): CategoryTemplate | null {
  if (icon && templateByIcon.has(icon)) return templateByIcon.get(icon)!
  if (name && templateByName.has(name.toLowerCase())) return templateByName.get(name.toLowerCase())!
  return null
}
