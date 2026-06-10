import { CATEGORY_TEMPLATES } from '../../../lib/categoryTemplates'

/** Spending envelopes only — income is logged on the transactions step, not as a planned envelope. */
const ONBOARDING_TEMPLATE_NAMES = ['Groceries', 'Rent', 'Dining Out', 'Transport'] as const

export const ONBOARDING_ENVELOPE_TEMPLATES = CATEGORY_TEMPLATES.filter((t) =>
  (ONBOARDING_TEMPLATE_NAMES as readonly string[]).includes(t.name),
)

export { inputClass } from '../../../lib/inputClass'
