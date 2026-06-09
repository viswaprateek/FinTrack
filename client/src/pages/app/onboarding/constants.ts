import { CATEGORY_TEMPLATES } from '../../../lib/categoryTemplates'

const ONBOARDING_TEMPLATE_NAMES = ['Groceries', 'Rent', 'Dining Out', 'Transport', 'Salary'] as const

export const ONBOARDING_ENVELOPE_TEMPLATES = CATEGORY_TEMPLATES.filter((t) =>
  (ONBOARDING_TEMPLATE_NAMES as readonly string[]).includes(t.name),
)

export { inputClass } from '../../../lib/inputClass'
