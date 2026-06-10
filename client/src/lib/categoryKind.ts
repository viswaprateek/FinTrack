import type { Category } from '../types'

export function isIncomeCategory(category: Pick<Category, 'type' | 'name'>): boolean {
  return category.type === 'income' || category.name.toLowerCase() === 'salary'
}

export function isExpenseEnvelope(category: Pick<Category, 'type' | 'name'>): boolean {
  return !isIncomeCategory(category)
}
