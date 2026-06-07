type ClassValue = string | number | null | false | undefined

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}

export { formatCurrencyAmount as formatCurrency } from './currencies'

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
}

export function formatShortDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d)
}
