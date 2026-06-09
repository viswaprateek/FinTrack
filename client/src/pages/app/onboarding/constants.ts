import { CATEGORY_TEMPLATES } from '../../../lib/categoryTemplates'

const ONBOARDING_TEMPLATE_NAMES = ['Groceries', 'Rent', 'Dining Out', 'Transport', 'Salary'] as const

export const ONBOARDING_ENVELOPE_TEMPLATES = CATEGORY_TEMPLATES.filter((t) =>
  (ONBOARDING_TEMPLATE_NAMES as readonly string[]).includes(t.name),
)

export const inputClass =
  'w-full rounded-xl border border-border-muted bg-input px-3 py-2.5 text-sm text-foreground focus:border-emerald-400 focus:outline-none transition-colors'
